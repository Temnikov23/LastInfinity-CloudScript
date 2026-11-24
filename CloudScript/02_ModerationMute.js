function modMuteLog(tag, data) {
    try {
        log.info('[Moderation Mute] ' + tag + ': ' + JSON.stringify(data));
    } catch (e) {
        log.info('[Moderation Mute] ' + tag);
    }
}

function modAllowedMuteDuration(permanent, minutes) {
    if (permanent === true) return true;
    return [5, 10, 15, 30, 60, 1440].indexOf(minutes) >= 0;
}

handlers.Moderation_ApplyMute = function (args, context) {
    modMuteLog('ApplyMute started', {
        by: modCallerId(context),
        target: modNormalizeId(args && args.playFabId)
    });

    if (!modIsAdmin(context)) return modDeny(context);

    var target = modNormalizeId(args && args.playFabId);
    var reason = String((args && args.reason) || '').trim();

    if (!target) {
        return { success:false, message:'Не указан PlayFab ID игрока' };
    }
    if (!reason) {
        return { success:false, message:'Укажите причину мута' };
    }

    var permanent = args.permanent === true;
    var minutes = parseInt(args.durationMinutes, 10);
    if (isNaN(minutes)) minutes = 0;

    if (!modAllowedMuteDuration(permanent, minutes)) {
        return { success:false, validation:true,
                 message:'Недопустимый срок мута' };
    }

    var state = modReadState(target);

    modMuteLog('InternalData read', {
        target: target,
        error: modLastReadError || null
    });

    if (modLastReadError) {
        modMuteLog('ApplyMute failed', { target:target, error:modLastReadError });
        return { success:false, saved:false,
                 message:'Ошибка чтения состояния: ' + modLastReadError };
    }

    var now = Date.now();
    var expiresAt = permanent ? null : now + minutes * 60 * 1000;

    var mute = {
        IsMuted: true,
        Reason: reason,
        MutedAt: now,
        MutedBy: modNormalizeId(modCallerId(context)),
        ExpiresAt: expiresAt,
        Permanent: permanent
    };

    // Сохраняем ВСЕ существующие поля (ban не должен пострадать).
    state.mute = mute;
    state.muted = true;
    state.muteReason = reason;
    state.muteIssuedAtMs = now;
    state.muteExpiresAtMs = expiresAt ? expiresAt : 0;
    state.mutePermanent = permanent;

    if (!state.actions) state.actions = [];
    state.actions.push({
        t: now, act: 'mute', target: target, reason: reason,
        ok: true, requestId: (args && args.requestId) || null
    });
    if (state.actions.length > 12) {
        state.actions.splice(0, state.actions.length - 12);
    }

    try {
        modWriteState(target, state);
    } catch (writeError) {
        var msg = 'Ошибка записи Internal Data: ' +
            (writeError && writeError.message ? writeError.message : String(writeError));
        modMuteLog('ApplyMute failed', { target:target, error:msg });
        return { success:false, saved:false, message:msg };
    }

    modMuteLog('InternalData saved', { target:target, muted:true });

    return {
        success: true,
        saved: true,
        muted: true,
        muteReason: reason,
        muteIssuedAtMs: now,
        muteExpiresAtMs: expiresAt ? expiresAt : 0,
        mutePermanent: permanent,
        message: 'Мут сохранён'
    };
};

handlers.Moderation_RemoveMute = function (args, context) {
    if (!modIsAdmin(context)) return modDeny(context);

    var target = modNormalizeId(args && args.playFabId);
    if (!target) return { success:false, message:'Не указан PlayFab ID игрока' };

    var state = modReadState(target);
    modMuteLog('InternalData read', { target:target, error:modLastReadError || null });

    if (modLastReadError) {
        return { success:false, saved:false,
                 message:'Ошибка чтения состояния: ' + modLastReadError };
    }

    var now = Date.now();

    state.mute = null;
    state.muted = false;
    state.muteReason = '';
    state.muteIssuedAtMs = 0;
    state.muteExpiresAtMs = 0;
    state.mutePermanent = false;

    if (!state.actions) state.actions = [];
    state.actions.push({
        t: now, act: 'unmute', target: target,
        reason: String((args && args.reason) || ''),
        ok: true, requestId: (args && args.requestId) || null
    });
    if (state.actions.length > 12) {
        state.actions.splice(0, state.actions.length - 12);
    }

    try {
        modWriteState(target, state);
    } catch (writeError) {
        return { success:false, saved:false,
                 message:'Ошибка записи Internal Data: ' + String(writeError) };
    }

    modMuteLog('RemoveMute success', { target:target });

    return {
        success: true,
        saved: true,
        muted: false,
        message: 'Мут снят'
    };
};

handlers.Moderation_GetMuteStatus = function (args, context) {
    var caller = modNormalizeId(modCallerId(context));
    if (!caller) {
        return { success:false, verified:false, reason:'currentPlayerId пуст' };
    }

    var target = caller;
    var requested = modNormalizeId(args && args.playFabId);

    if (requested && requested !== caller) {
        if (!modIsAdmin(context)) {
            return { success:false, verified:false, adminCheck:false,
                     reason:'Недостаточно прав для проверки другого игрока' };
        }
        target = requested;
    }

    var state = modReadState(target);

    if (modLastReadError) {
        modMuteLog('Status checked', { playFabId:target, verified:false,
                                   error:modLastReadError });
        return { success:false, verified:false,
                 reason:'Ошибка чтения состояния: ' + modLastReadError };
    }

    var m = state.mute || null;
    var muted = false;
    var reason = '';
    var mutedAt = 0;
    var expiresAt = 0;
    var permanent = false;

    if (m) {
        muted = m.IsMuted === true || state.muted === true;
        reason = String(m.Reason || state.muteReason || '');
        mutedAt = parseInt(m.MutedAt, 10) || parseInt(state.muteIssuedAtMs, 10) || 0;
        permanent = m.Permanent === true || state.mutePermanent === true;
        expiresAt = m.ExpiresAt ? parseInt(m.ExpiresAt, 10)
            : (parseInt(state.muteExpiresAtMs, 10) || 0);
    } else {
        muted = state.muted === true;
        reason = String(state.muteReason || '');
        mutedAt = parseInt(state.muteIssuedAtMs, 10) || 0;
        permanent = state.mutePermanent === true;
        expiresAt = parseInt(state.muteExpiresAtMs, 10) || 0;
    }

    var expired = false;
    if (muted && !permanent && expiresAt > 0 && expiresAt <= Date.now()) {
        muted = false;
        expired = true;
        //permанентно не перезаписываем — клиент получит актуальный статус,
        // а запись будет исправлена ближайшим Update из админ-панели.
    }

    var reply = {
        success: true,
        verified: true,
        playFabId: target,
        muted: muted,
        reason: reason,
        permanent: permanent,
        mutedAt: mutedAt,
        expiresAt: permanent ? 0 : expiresAt,
        expired: expired,
        serverNowMs: Date.now(),
        source: 'moderation_state (User Internal Data)',
        message: muted ? 'Активный мут' : (expired ? 'Срок мута истёк' : 'Мута нет')
    };

    modMuteLog('Status checked', { playFabId:target, muted:muted,
                               expired:expired, source:reply.source });

    return reply;
};
