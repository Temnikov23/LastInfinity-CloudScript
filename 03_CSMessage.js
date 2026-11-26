var MSG_HISTORY_LIMIT = 100;
var MSG_MAX_DIALOGS = 12;          // временный лимит: 12 × 100 × ~1 КБ ≈ 1,3 МБ
var MSG_MAX_TEXT_LENGTH = 1000;
var MSG_MAX_ID_LENGTH = 64;
var MSG_MIN_SEND_INTERVAL_MS = 300;
var MSG_MAX_RETRIES = 3;
var MSG_REGISTERED_FLAG = "true";

var MSG_EVENT_PREFIX = "MSG_E_";
var MSG_DIALOG_PREFIX = "MSG_D_";
var MSG_READ_PREFIX = "MSG_R_";

// ----------------------------------------------------------------------------
//  Утилиты
// ----------------------------------------------------------------------------

function msgTrim(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/^\s+|\s+$/g, "");
}

function msgIsValidId(value) {
    if (typeof value !== "string") return false;
    var v = msgTrim(value);
    if (v.length === 0 || v.length > MSG_MAX_ID_LENGTH) return false;
    return /^[A-Za-z0-9_-]+$/.test(v);
}

function msgNowMs() {
    return new Date().getTime();
}

function msgPairKey(a, b) {
    return (a < b) ? (a + "_" + b) : (b + "_" + a);
}

function msgThreadStorage(me, partner) {
    var owner = (me < partner) ? me : partner;
    return { owner: owner, pair: msgPairKey(me, partner) };
}

// В ключ входит отправитель: MessageId уникален в рамках пары ДЛЯ КАЖДОГО
// отправителя. Иначе A и B, выбравшие одинаковый MessageId в одном диалоге,
// перезаписали бы событие друг друга.
function msgEventKey(pair, sender, messageId) {
    return MSG_EVENT_PREFIX + pair + "_" + sender + "_" + messageId;
}

function msgDialogKey(partner) {
    return MSG_DIALOG_PREFIX + partner;
}

function msgReadKey(userId, key) {
    try {
        var r = server.GetUserInternalData({ PlayFabId: userId, Keys: [key] });
        if (!r || !r.Data || !r.Data[key]) return null;
        return r.Data[key].Value || null;
    } catch (e) {
        log.error("Messaging: чтение " + key + ": " + e);
        return null;
    }
}

function msgReadAll(userId) {
    try {
        var r = server.GetUserInternalData({ PlayFabId: userId });
        return (r && r.Data) ? r.Data : {};
    } catch (e) {
        log.error("Messaging: чтение всех данных " + userId + ": " + e);
        return {};
    }
}

function msgWriteKey(userId, key, value) {
    var data = {};
    data[key] = value;
    try {
        server.UpdateUserInternalData({ PlayFabId: userId, Data: data });
        return true;
    } catch (e) {
        log.error("Messaging: запись " + key + ": " + e);
        return false;
    }
}

function msgDeleteKeys(userId, keys) {
    if (!keys || keys.length === 0) return true;
    try {
        server.UpdateUserInternalData({ PlayFabId: userId, KeysToRemove: keys });
        return true;
    } catch (e) {
        log.error("Messaging: удаление ключей у " + userId + ": " + e);
        return false;
    }
}

function msgParse(value, fallback) {
    if (!value) return fallback;
    try { return JSON.parse(value); }
    catch (e) { return fallback; }
}

function msgHasMessage(thread, id) {
    for (var i = 0; i < thread.length; i++) {
        if (thread[i] && thread[i].id === id) return true;
    }
    return false;
}

// Читает ВСЕ события канонической копии диалога, сортирует по времени.
function msgReadThread(me, partner) {
    var storage = msgThreadStorage(me, partner);
    var all = msgReadAll(storage.owner);
    var prefix = MSG_EVENT_PREFIX + storage.pair + "_";
    var result = [];

    for (var key in all) {
        if (!all.hasOwnProperty(key) || key.indexOf(prefix) !== 0) continue;
        var m = msgParse(all[key].Value, null);
        if (m && m.id && typeof m.ts === "number") result.push(m);
    }

    result.sort(function (a, b) { return a.ts - b.ts; });
    if (result.length > MSG_HISTORY_LIMIT) {
        result = result.slice(result.length - MSG_HISTORY_LIMIT);
    }
    return result;
}

// Удаляет самые старые события сверх лимита (независимые ключи — безопасно).
function msgTrimThread(me, partner) {
    var storage = msgThreadStorage(me, partner);
    var all = msgReadAll(storage.owner);
    var prefix = MSG_EVENT_PREFIX + storage.pair + "_";
    var items = [];

    for (var key in all) {
        if (!all.hasOwnProperty(key) || key.indexOf(prefix) !== 0) continue;
        var m = msgParse(all[key].Value, null);
        if (m && m.id && typeof m.ts === "number") items.push({ key: key, ts: m.ts });
    }

    if (items.length <= MSG_HISTORY_LIMIT) return;

    items.sort(function (a, b) { return a.ts - b.ts; });
    var toDelete = [];
    for (var i = 0; i < items.length - MSG_HISTORY_LIMIT; i++) {
        toDelete.push(items[i].key);
    }
    msgDeleteKeys(storage.owner, toDelete);
}

// Гарантированная запись одного сообщения в уникальный ключ + подтверждение.
function msgSaveEventSafely(me, partner, message) {
    var storage = msgThreadStorage(me, partner);
    var key = msgEventKey(storage.pair, message.from, message.id);
    var serialized = JSON.stringify(message);

    for (var attempt = 0; attempt < MSG_MAX_RETRIES; attempt++) {
        // Тот же MessageId от того же отправителя — идемпотентно,
        // но только если текст совпадает. Иначе это конфликт, не дубликат.
        var existing = msgReadKey(storage.owner, key);
        if (existing) {
            var parsed = msgParse(existing, null);
            if (parsed && parsed.id === message.id) {
                if (parsed.text !== message.text || parsed.from !== message.from) {
                    return { ok: false, conflict: true,
                             error: "MessageId уже использован с другим текстом/отправителем" };
                }
                return { ok: true, duplicate: true, stored: parsed };
            }
        }

        // Одна атомарная запись в уникальный ключ; другой запрос не пишет сюда.
        if (!msgWriteKey(storage.owner, key, serialized)) continue;

        // Подтверждение: повторное чтение того же ключа.
        var confirm = msgReadKey(storage.owner, key);
        if (!confirm) continue;
        var confirmed = msgParse(confirm, null);
        if (!confirmed || confirmed.id !== message.id || confirmed.text !== message.text ||
            confirmed.from !== message.from) continue;

        return { ok: true, duplicate: false, stored: confirmed };
    }

    return { ok: false, duplicate: false, error: "не удалось подтвердить запись сообщения" };
}

function msgCountDialogs(userId) {
    var all = msgReadAll(userId);
    var count = 0;
    for (var key in all) {
        if (all.hasOwnProperty(key) && key.indexOf(MSG_DIALOG_PREFIX) === 0) count++;
    }
    return count;
}

function msgTouchDialog(userId, partnerId, ts, preview) {
    var key = msgDialogKey(partnerId);
    var prev = msgParse(msgReadKey(userId, key), {});
    if (!prev || typeof prev !== "object") prev = {};
    var entry = {
        partnerId: partnerId,
        lastAt: ts,
        lastTs: ts,
        preview: msgTrim(preview).slice(0, 120),
        unread: (prev.unread || 0) + 1
    };
    return msgWriteKey(userId, key, JSON.stringify(entry)) ? entry : null;
}

function msgIsRegistered(playFabId) {
    try {
        var result = server.GetUserReadOnlyData({
            PlayFabId: playFabId, Keys: ["registered"]
        });
        return !!(result && result.Data && result.Data.registered &&
                  result.Data.registered.Value === MSG_REGISTERED_FLAG);
    } catch (e) {
        log.error("Messaging: проверка registered " + playFabId + ": " + e);
        return false;
    }
}

function msgGetNickname(playFabId) {
    try {
        var r = server.GetUserReadOnlyData({ PlayFabId: playFabId, Keys: ["username"] });
        if (r && r.Data && r.Data.username && r.Data.username.Value) return r.Data.username.Value;
    } catch (e) { /* игнорируем */ }

    try {
        var p = server.GetPlayerProfile({
            PlayFabId: playFabId,
            ProfileConstraints: { ShowDisplayName: true, ShowAvatarUrl: true }
        });
        if (p && p.PlayerProfile && p.PlayerProfile.DisplayName) return p.PlayerProfile.DisplayName;
    } catch (e2) { /* игнорируем */ }
    return "";
}

function msgGetAvatarUrl(playFabId) {
    try {
        var r = server.GetUserData({ PlayFabId: playFabId, Keys: ["AvatarUrl"] });
        if (r && r.Data && r.Data.AvatarUrl && r.Data.AvatarUrl.Value) return r.Data.AvatarUrl.Value;
    } catch (e) { /* игнорируем */ }
    return "";
}

// ----------------------------------------------------------------------------
// Handlers (имена НЕ меняем — Unity-клиент остаётся прежним)
// ----------------------------------------------------------------------------

handlers.SendPrivateMessage = function (args, context) {
    var senderId = currentPlayerId; // SERVER-сессия; клиент не может подменить

    if (!args) return { success: false, error: "Аргументы не переданы" };

    var recipientId = msgTrim(args.recipientPlayFabId || args.RecipientPlayFabId);
    var messageId = msgTrim(args.messageId || args.MessageId);
    var text = msgTrim(args.messageText || args.MessageText || args.text);
    var tsArg = args.timestampUtc || args.TimestampUtc;
    var ts = (typeof tsArg === "number" && isFinite(tsArg)) ? tsArg : msgNowMs();

    if (!msgIsValidId(recipientId)) return { success: false, error: "Неверный recipientPlayFabId" };
    if (!msgIsValidId(messageId)) return { success: false, error: "Неверный MessageId" };
    if (text.length === 0) return { success: false, error: "Пустой текст сообщения" };
    if (text.length > MSG_MAX_TEXT_LENGTH) {
        return { success: false, error: "Слишком длинный текст (максимум " + MSG_MAX_TEXT_LENGTH + ")" };
    }
    if (recipientId === senderId) {
        return { success: false, error: "Нельзя отправлять сообщение самому себе" };
    }
    if (ts <= 0 || ts > msgNowMs() + 60000) {
        return { success: false, error: "Неверное время отправки" };
    }
    if (!msgIsRegistered(recipientId)) {
        return { success: false, error: "Получатель не найден или не зарегистрирован" };
    }

    // Идемпотентность до проверки частоты.
    var storage = msgThreadStorage(senderId, recipientId);
    var eventKey = msgEventKey(storage.pair, senderId, messageId);
    var existing = msgReadKey(storage.owner, eventKey);
    if (existing) {
        var old = msgParse(existing, null);
        if (old && old.id === messageId &&
            (old.text !== text || old.from !== senderId)) {
            return { success: false,
                     error: "MessageId уже использован с другим текстом/отправителем" };
        }
        // Повтор той же отправки: НЕ создаём дубликат, но восстанавливаем индексы,
        // если прошлый раз запись индекса не удалась (частичный сбой).
        var repairSrc = msgTouchDialog(senderId, recipientId,
                         old ? old.ts : ts, old ? old.text : text);
        var repairDst = msgTouchDialog(recipientId, senderId,
                         old ? old.ts : ts, old ? old.text : text);
        if (!repairSrc || !repairDst) {
            return { success: false,
                     error: "Сообщение уже сохранено, но не удалось восстановить индекс диалога" };
        }
        return { success: true, duplicate: true, message: old,
                 countSender: msgReadThread(senderId, recipientId).length };
    }

    // Защита от частых отправок по индексу отправителя (произведённые данные).
    var ownDialog = msgParse(msgReadKey(senderId, msgDialogKey(recipientId)), {});
    if (ownDialog && (msgNowMs() - (ownDialog.lastAt || 0)) < MSG_MIN_SEND_INTERVAL_MS) {
        return { success: false, error: "Слишком много сообщений, попробуйте позже" };
    }

    // Лимит диалогов: НЕ удаляем existing history, просто отклоняем новый диалог.
    var senderHasDialog = !!msgReadKey(senderId, msgDialogKey(recipientId));
    var recipientHasDialog = !!msgReadKey(recipientId, msgDialogKey(senderId));

    if (!senderHasDialog && msgCountDialogs(senderId) >= MSG_MAX_DIALOGS) {
        return { success: false, error: "Достигнут лимит диалогов (" + MSG_MAX_DIALOGS +
                 "). Удалите старый диалог вручную или обратитесь в поддержку." };
    }
    if (!recipientHasDialog && msgCountDialogs(recipientId) >= MSG_MAX_DIALOGS) {
        return { success: false, error: "У получателя достигнут лимит диалогов (" +
                 MSG_MAX_DIALOGS + ")." };
    }

    var message = { id: messageId, from: senderId, to: recipientId, text: text, ts: ts };

    // ЕДИНСТВЕННЫЙ источник достоверности — каноническое событие.
    var saved = msgSaveEventSafely(senderId, recipientId, message);
    if (!saved.ok) {
        return { success: false, error: "Не удалось подтвердить сохранение: " + saved.error };
    }

    msgTrimThread(senderId, recipientId);

    // Индекс — производные данные, но без него диалог не виден во входящих.
    // Успех НЕ сообщается клиенту, пока индексы обоих участников не записаны.
    var okSrc = msgTouchDialog(senderId, recipientId, ts, text);
    var okDst = msgTouchDialog(recipientId, senderId, ts, text);
    if (!okSrc || !okDst) {
        return { success: false,
                 error: "Сообщение сохранено, но индекс диалога не обновлён. " +
                        "Повторите отправку с тем же MessageId для восстановления." };
    }

    var thread = msgReadThread(senderId, recipientId);

    return {
        success: true,
        duplicate: !!saved.duplicate,
        message: message,
        countSender: thread.length,
        historyLimit: MSG_HISTORY_LIMIT
    };
};

handlers.GetIncomingDialogs = function (args, context) {
    var me = currentPlayerId;
    var all = msgReadAll(me);
    var result = [];

    for (var key in all) {
        if (!all.hasOwnProperty(key) || key.indexOf(MSG_DIALOG_PREFIX) !== 0) continue;
        var entry = msgParse(all[key].Value, null);
        if (!entry || !msgIsValidId(entry.partnerId)) continue;

        // Восстанавливаем unread из канонической истории и метки прочитанного.
        var pair = msgPairKey(me, entry.partnerId);
        var lastRead = msgParse(msgReadKey(me, MSG_READ_PREFIX + pair), {});
        var readTs = (lastRead && typeof lastRead.ts === "number") ? lastRead.ts : 0;
        var thread = msgReadThread(me, entry.partnerId);
        var unread = 0;
        for (var i = 0; i < thread.length; i++) {
            if (thread[i].from !== me && (thread[i].ts || 0) > readTs) unread++;
        }

        result.push({
            partnerId: entry.partnerId,
            lastAt: entry.lastAt || 0,
            lastTs: entry.lastTs || 0,
            preview: entry.preview || "",
            unread: unread,
            nickname: msgGetNickname(entry.partnerId),
            avatarUrl: msgGetAvatarUrl(entry.partnerId)
        });
    }

    result.sort(function (a, b) { return b.lastAt - a.lastAt; });
    return { success: true, dialogs: result, count: result.length };
};

handlers.GetPrivateMessages = function (args, context) {
    var me = currentPlayerId;
    if (!args) return { success: false, error: "Аргументы не переданы" };

    var partnerId = msgTrim(args.partnerPlayFabId || args.PartnerPlayFabId);
    if (!msgIsValidId(partnerId)) return { success: false, error: "Неверный partnerPlayFabId" };
    if (partnerId === me) return { success: false, error: "Нельзя открыть диалог с собой" };

    var thread = msgReadThread(me, partnerId);

    // Отмечаем прочитанное в отдельном ключе (не перезаписываем историю).
    if (thread.length > 0) {
        var pair = msgPairKey(me, partnerId);
        msgWriteKey(me, MSG_READ_PREFIX + pair, JSON.stringify({ ts: thread[thread.length - 1].ts }));
    }

    return {
        success: true,
        partnerId: partnerId,
        messages: thread,
        count: thread.length,
        historyLimit: MSG_HISTORY_LIMIT,
        nickname: msgGetNickname(partnerId),
        avatarUrl: msgGetAvatarUrl(partnerId)
    };
};

handlers.GetMessagingUsers = function (args, context) {
    var me = currentPlayerId;
    var result = [];

    try {
        var indexResult = server.GetTitleInternalData({ Keys: ["NicknameIndex"] });
        var players = {};
        if (indexResult && indexResult.Data && indexResult.Data.NicknameIndex &&
            indexResult.Data.NicknameIndex.Value) {
            players = msgParse(indexResult.Data.NicknameIndex.Value, {});
        }

        for (var key in players) {
            if (!players.hasOwnProperty(key)) continue;
            var id = msgTrim(players[key]);
            if (!id || id === me) continue;
            if (result.length >= MSG_HISTORY_LIMIT) break;
            result.push({ playFabId: id, nickname: key, avatarUrl: msgGetAvatarUrl(id) });
        }
    } catch (e) {
        log.error("Messaging: GetMessagingUsers: " + e);
    }

    var query = args ? msgTrim(args.query || args.nickname || "") : "";
    if (query) {
        var q = query.toLowerCase();
        var filtered = [];
        for (var j = 0; j < result.length; j++) {
            if (String(result[j].nickname || "").toLowerCase().indexOf(q) !== -1 ||
                String(result[j].playFabId || "").toLowerCase().indexOf(q) !== -1) {
                filtered.push(result[j]);
            }
        }
        result = filtered;
    }

    return { success: true, users: result, count: result.length };
};

handlers.CheckNewMessages = function (args, context) {
    var me = currentPlayerId;
    var since = 0;
    if (args && args.sinceMs !== undefined) {
        var parsed = parseInt(args.sinceMs, 10);
        if (!isNaN(parsed) && parsed > 0) since = parsed;
    }

    var all = msgReadAll(me);
    var changed = [];
    var totalUnread = 0;

    for (var key in all) {
        if (!all.hasOwnProperty(key) || key.indexOf(MSG_DIALOG_PREFIX) !== 0) continue;
        var entry = msgParse(all[key].Value, null);
        if (!entry || !msgIsValidId(entry.partnerId)) continue;

        var pair = msgPairKey(me, entry.partnerId);
        var lastRead = msgParse(msgReadKey(me, MSG_READ_PREFIX + pair), {});
        var readTs = (lastRead && typeof lastRead.ts === "number") ? lastRead.ts : 0;
        var thread = msgReadThread(me, entry.partnerId);
        var unread = 0;
        for (var i = 0; i < thread.length; i++) {
            if (thread[i].from !== me && (thread[i].ts || 0) > readTs) unread++;
        }
        totalUnread += unread;

        if ((entry.lastAt || 0) > since || unread > 0) {
            changed.push({ partnerId: entry.partnerId, lastAt: entry.lastAt || 0,
                           unread: unread, preview: entry.preview || "" });
        }
    }

    return { success: true, changed: changed, totalUnread: totalUnread,
             serverTimeMs: msgNowMs() };
};
