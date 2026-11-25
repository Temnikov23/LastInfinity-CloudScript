// 24423

function GetInternalList(playFabId, key){var result = server.GetUserInternalData({PlayFabId: playFabId,Keys: [key]});
if (!result ||!result.Data ||!result.Data[key] || !result.Data[key].Value){return [];}
try{var list =JSON.parse(result.Data[key].Value);if (!Array.isArray(list)){return [];}return list;}
catch (e){return [];}}
function SaveInternalList(playFabId,key,list){var data = {};data[key] =JSON.stringify(list);
server.UpdateUserInternalData({PlayFabId: playFabId,Data: data});}
function AddNotification(targetPlayerId,type,playerId){if (!targetPlayerId){
log.error("AddNotification: targetPlayerId пустой"); return false;}
if (!type) {log.error("AddNotification: type пустой");return false;}if (playerId === null ||playerId === undefined){playerId = "";}
log.info("PlayerId: " +playerId);
var data = server.GetUserInternalData({PlayFabId:targetPlayerId,Keys:["Notifications"]});
var notifications = [];if (data && data.Data &&data.Data.Notifications && data.Data.Notifications.Value){try
{notifications = JSON.parse(data.Data.Notifications.Value);
if (!Array.isArray(notifications)){notifications = [];}}catch (e){
log.error("Notifications JSON ERROR: " +e);notifications = [];}}
var notificationId = String(new Date().getTime()) + "_" + String(Math.floor(Math.random() * 1000000));
var notification ={id:notificationId,type:type,playerId:playerId,createdAt:new Date().toISOString()};
notifications.push(notification);if (notifications.length > 50){notifications =notifications.slice(notifications.length - 50);
}server.UpdateUserInternalData({PlayFabId:targetPlayerId,Data:{Notifications:JSON.stringify(notifications)}});
log.info("TOTAL NOTIFICATIONS: " + notifications.length);return true;}
handlers.FirstLogin = function(args, context)
{if (!args || !args.username){return {success: false, error: "username не передан"};}var username = String(args.username).trim();
if (username.length < 2){return {success: false,error: "Ник слишком короткий"};}var data =server.GetUserReadOnlyData({
PlayFabId:currentPlayerId, Keys:["registered"]});if (data && data.Data && data.Data["registered"]){return {success: true,message: "Уже есть профиль" };}
server.UpdateUserReadOnlyData({
        PlayFabId:
            currentPlayerId,

        Data:
        {
            registered:
                "true",

            username:
                username,

            deviceId:
                args.deviceId || "",

            deviceName:
                args.deviceName || "",

            registerDate:
                args.registerDate || "",

            sdxi12dp:
                args.sdxi12dp || ""
        }
    });
    var indexResult =
        server.GetTitleInternalData({
            Keys:
            [
                "NicknameIndex"
            ]
        });
    var players = {};
    if (
        indexResult &&
        indexResult.Data &&
        indexResult.Data.NicknameIndex &&
        indexResult.Data.NicknameIndex.Value
    )
    {
        try
        {
            players =
                JSON.parse(
                    indexResult.Data
                        .NicknameIndex
                        .Value
                );
        }
        catch(e)
        {
            log.error(
                "Ошибка NicknameIndex: " +
                e
            );

            players = {};
        }
    }
    var nicknameKey =
        username.toLowerCase();
    if (
        players[nicknameKey] &&
        players[nicknameKey] !== currentPlayerId
    )
    {
        return {
            success: false,
            error: "Этот ник уже занят"
        };
    }


    players[nicknameKey] =
        currentPlayerId;
    server.SetTitleInternalData({
        Key:
            "NicknameIndex",

        Value:
            JSON.stringify(players)
    });
    return {
        success: true,

        message:
            "OK",

        nickname:
            username,

        playFabId:
            currentPlayerId
    };
};

handlers.GetPlayerAvatar = function(
    args,
    context
)
{
    if (!args || !args.playFabId)
    {
        return {
            success: false,
            error: "playFabId не передан"
        };
    }


    var playFabId =
        String(
            args.playFabId
        );


    var result =
        server.GetUserData({
            PlayFabId:
                playFabId,

            Keys:
            [
                "AvatarUrl"
            ]
        });


    if (
        !result ||
        !result.Data ||
        !result.Data.AvatarUrl ||
        !result.Data.AvatarUrl.Value
    )
    {
        return {
            success: false,

            error:
                "AvatarUrl не найден"
        };
    }


    return {
        success: true,

        playFabId:
            playFabId,

        downloadUrl:
            result.Data.AvatarUrl.Value
    };
};


handlers.getAvatarUrl = function(
    args,
    context
)
{
    if (!args || !args.playFabId)
    {
        return {
            success: false,
            avatarUrl: "",
            error: "playFabId не передан"
        };
    }


    var playFabId =
        String(
            args.playFabId
        );


    var result =
        server.GetUserData({
            PlayFabId:
                playFabId,

            Keys:
            [
                "AvatarUrl"
            ]
        });


    if (
        !result ||
        !result.Data ||
        !result.Data.AvatarUrl ||
        !result.Data.AvatarUrl.Value
    )
    {
        return {
            success: false,

            avatarUrl: "",

            error:
                "AvatarUrl не найден"
        };
    }


    return {
        success: true,

        avatarUrl:
            result.Data.AvatarUrl.Value
    };
};
handlers.addAdmin = function(
    args,
    context
)
{
    var targetPlayFabId = args.targetPlayFabId;

    if (!targetPlayFabId)
    {
        throw "targetPlayFabId отсутствует";
    }

    // Проверяем, что игрок существует
    var player = server.GetPlayerProfile({
        PlayFabId: targetPlayFabId
    });

    if (!player || !player.PlayerProfile)
    {
        throw "Игрок не найден: " + targetPlayFabId;
    }

    // Выдаём права администратора
    server.UpdateUserInternalData({
        PlayFabId: targetPlayFabId,
        Data:
        {
            IsAdmin: "true"
        }
    });

    // Создаём уведомление
    AddNotification(
        targetPlayFabId,
        "admin_granted",
        ""
    );

    log.info(
        "Игроку " +
        targetPlayFabId +
        " выдан администратор. " +
        "Уведомление admin_granted создано."
    );

    return {
        success: true,
        playFabId: targetPlayFabId,
        isAdmin: true
    };
};

handlers.getAdminStatus = function(
    args,
    context
)
{
    var playFabId =
        args.playFabId;


    if (!playFabId)
    {
        return {
            success: false,
            isAdmin: false,
            error:
                "PlayFabId не передан"
        };
    }


    var data =
        server.GetUserInternalData({
            PlayFabId:
                playFabId,

            Keys:
            [
                "IsAdmin"
            ]
        });


    var isAdmin =
        false;


    if (
        data &&
        data.Data &&
        data.Data.IsAdmin &&
        data.Data.IsAdmin.Value === "true"
    )
    {
        isAdmin = true;
    }


    return {
        success:
            true,

        playFabId:
            playFabId,

        isAdmin:
            isAdmin
    };
};

handlers.checkAdmin = function(
    args,
    context
)
{
    var data =
        server.GetUserInternalData({
            PlayFabId:
                currentPlayerId,

            Keys:
            [
                "IsAdmin"
            ]
        });


    var isAdmin =
        false;


    if (
        data &&
        data.Data &&
        data.Data.IsAdmin &&
        data.Data.IsAdmin.Value === "true"
    )
    {
        isAdmin = true;
    }


    return {
        success:
            true,

        isAdmin:
            isAdmin,

        playFabId:
            currentPlayerId
    };
};
handlers.checkPlayerAdmin = function(
    args,
    context
)
{
    var playFabId =
        args.playFabId;


    if (!playFabId)
    {
        throw "playFabId отсутствует";
    }


    var data =
        server.GetUserInternalData({
            PlayFabId:
                playFabId,

            Keys:
            [
                "IsAdmin"
            ]
        });


    var isAdmin =
        false;


    if (
        data &&
        data.Data &&
        data.Data.IsAdmin &&
        data.Data.IsAdmin.Value === "true"
    )
    {
        isAdmin = true;
    }


    return {
        success:
            true,

        playFabId:
            playFabId,

        isAdmin:
            isAdmin
    };
};
handlers.checkMyAdmin = function(
    args,
    context
)
{
    var data =
        server.GetUserInternalData({
            PlayFabId:
                currentPlayerId,

            Keys:
            [
                "IsAdmin"
            ]
        });


    var isAdmin =
        false;


    if (
        data &&
        data.Data &&
        data.Data.IsAdmin &&
        data.Data.IsAdmin.Value === "true"
    )
    {
        isAdmin = true;
    }


    return {
        success:
            true,

        isAdmin:
            isAdmin,

        playFabId:
            currentPlayerId
    };
};
handlers.sendFriendRequest = function(
    args,
    context
)
{
    var senderId =
        currentPlayerId;
    if (
        !args ||
        !args.targetPlayFabId
    )
    {
        return {
            success: false,

            error:
                "targetPlayFabId не передан"
        };
    }


    var targetId =
        String(
            args.targetPlayFabId
        ).trim();


    if (!targetId)
    {
        return {
            success: false,

            error:
                "targetPlayFabId пустой"
        };
    }


    if (
        senderId ===
        targetId
    )
    {
        return {
            success: false,

            error:
                "Нельзя отправить заявку самому себе"
        };
    }


    log.info(
        "===================================="
    );

    log.info(
        "SEND FRIEND REQUEST"
    );
    log.info(
        "===================================="
    );

    var targetData =
        server.GetUserInternalData({
            PlayFabId:
                targetId,

            Keys:
            [
                "FriendRequests",
                "Friends"
            ]
        });


    var requests =
        [];


    var targetFriends =
        [];


    if (
        targetData &&
        targetData.Data &&
        targetData.Data.FriendRequests &&
        targetData.Data.FriendRequests.Value
    )
    {
        try
        {
            requests =
                JSON.parse(
                    targetData.Data
                        .FriendRequests
                        .Value
                );

            if (!Array.isArray(
                requests))
            {
                requests = [];
            }
        }
        catch(e)
        {
            requests = [];
        }
    }


    if (
        targetData &&
        targetData.Data &&
        targetData.Data.Friends &&
        targetData.Data.Friends.Value
    )
    {
        try
        {
            targetFriends =
                JSON.parse(
                    targetData.Data
                        .Friends
                        .Value
                );

            if (!Array.isArray(
                targetFriends))
            {
                targetFriends = [];
            }
        }
        catch(e)
        {
            targetFriends = [];
        }
    }
    if (
        targetFriends.indexOf(
            senderId
        ) !== -1
    )
    {
        return {
            success: false,

            error:
                "Игрок уже находится в друзьях"
        };
    }

    var requestWasNew =
        requests.indexOf(
            senderId
        ) === -1;


    if (requestWasNew)
    {
        requests.push(
            senderId
        );
    }


    server.UpdateUserInternalData({
        PlayFabId:
            targetId,

        Data:
        {
            FriendRequests:
                JSON.stringify(
                    requests
                )
        }
    });

    var senderData =
        server.GetUserInternalData({
            PlayFabId:
                senderId,

            Keys:
            [
                "OutgoingFriendRequests"
            ]
        });


    var outgoing =
        [];


    if (
        senderData &&
        senderData.Data &&
        senderData.Data.OutgoingFriendRequests &&
        senderData.Data.OutgoingFriendRequests.Value
    )
    {
        try
        {
            outgoing =
                JSON.parse(
                    senderData.Data
                        .OutgoingFriendRequests
                        .Value
                );

            if (!Array.isArray(
                outgoing))
            {
                outgoing = [];
            }
        }
        catch(e)
        {
            outgoing = [];
        }
    }


    if (
        outgoing.indexOf(
            targetId
        ) === -1
    )
    {
        outgoing.push(
            targetId
        );
    }


    server.UpdateUserInternalData({
        PlayFabId:
            senderId,

        Data:
        {
            OutgoingFriendRequests:
                JSON.stringify(
                    outgoing
                )
        }
    });

    if (requestWasNew)
    {
        AddNotification(
            targetId,
            "friend_request",
            senderId
        );
    }
return {
        success:
            true,

        senderPlayFabId:
            senderId,

        targetPlayFabId:
            targetId
    };
};

handlers.getFriendRequests = function(
    args,
    context
)
{
    var requests =
        GetInternalList(
            currentPlayerId,
            "FriendRequests"
        );


    log.info(
        "GET FRIEND REQUESTS: " +
        currentPlayerId
    );


    log.info(
        "FriendRequests = " +
        JSON.stringify(
            requests
        )
    );


    return {
        success:
            true,

        requests:
            requests
    };
};


// ============================================================
// GET OUTGOING FRIEND REQUESTS
// ============================================================

handlers.getOutgoingFriendRequests =
function(
    args,
    context
)
{
    var requests =
        GetInternalList(
            currentPlayerId,
            "OutgoingFriendRequests"
        );


    return {
        success:
            true,

        requests:
            requests
    };
};


// ============================================================
// ACCEPT FRIEND REQUEST
// ============================================================

handlers.acceptFriendRequest = function(
    args,
    context
)
{
    var receiverId =
        currentPlayerId;


    if (
        !args ||
        !args.fromPlayFabId
    )
    {
        return {
            success:
                false,

            error:
                "fromPlayFabId не передан"
        };
    }


    var senderId =
        String(
            args.fromPlayFabId
        ).trim();


    if (!senderId)
    {
        return {
            success:
                false,

            error:
                "fromPlayFabId пустой"
        };
    }


    if (
        senderId ===
        receiverId
    )
    {
        return {
            success:
                false,

            error:
                "Нельзя добавить самого себя"
        };
    }


    log.info(
        "ACCEPT FRIEND REQUEST: " +
        senderId +
        " -> " +
        receiverId
    );


    // =====================================================
    // RECEIVER
    // =====================================================

    var receiverData =
        server.GetUserInternalData({
            PlayFabId:
                receiverId,

            Keys:
            [
                "Friends",
                "FriendRequests"
            ]
        });


    var receiverFriends =
        [];


    var receiverRequests =
        [];


    if (
        receiverData &&
        receiverData.Data &&
        receiverData.Data.Friends &&
        receiverData.Data.Friends.Value
    )
    {
        try
        {
            receiverFriends =
                JSON.parse(
                    receiverData.Data
                        .Friends
                        .Value
                );

            if (!Array.isArray(
                receiverFriends))
            {
                receiverFriends = [];
            }
        }
        catch(e)
        {
            receiverFriends = [];
        }
    }


    if (
        receiverData &&
        receiverData.Data &&
        receiverData.Data.FriendRequests &&
        receiverData.Data.FriendRequests.Value
    )
    {
        try
        {
            receiverRequests =
                JSON.parse(
                    receiverData.Data
                        .FriendRequests
                        .Value
                );

            if (!Array.isArray(
                receiverRequests))
            {
                receiverRequests = [];
            }
        }
        catch(e)
        {
            receiverRequests = [];
        }
    }


    // =====================================================
    // ПРОВЕРЯЕМ ЗАЯВКУ
    // =====================================================

    if (
        receiverRequests.indexOf(
            senderId
        ) === -1
    )
    {
        return {
            success:
                false,

            error:
                "Заявка не найдена"
        };
    }


    // =====================================================
    // ДОБАВЛЯЕМ В ДРУЗЬЯ
    // =====================================================

    if (
        receiverFriends.indexOf(
            senderId
        ) === -1
    )
    {
        receiverFriends.push(
            senderId
        );
    }


    // =====================================================
    // УДАЛЯЕМ ЗАЯВКУ
    // =====================================================

    receiverRequests =
        receiverRequests.filter(
            function(id)
            {
                return id !== senderId;
            }
        );


    // =====================================================
    // СОХРАНЯЕМ RECEIVER
    // =====================================================

    server.UpdateUserInternalData({
        PlayFabId:
            receiverId,

        Data:
        {
            Friends:
                JSON.stringify(
                    receiverFriends
                ),

            FriendRequests:
                JSON.stringify(
                    receiverRequests
                )
        }
    });


    // =====================================================
    // SENDER
    // =====================================================

    var senderData =
        server.GetUserInternalData({
            PlayFabId:
                senderId,

            Keys:
            [
                "Friends",
                "OutgoingFriendRequests"
            ]
        });


    var senderFriends =
        [];


    var senderOutgoing =
        [];


    if (
        senderData &&
        senderData.Data &&
        senderData.Data.Friends &&
        senderData.Data.Friends.Value
    )
    {
        try
        {
            senderFriends =
                JSON.parse(
                    senderData.Data
                        .Friends
                        .Value
                );

            if (!Array.isArray(
                senderFriends))
            {
                senderFriends = [];
            }
        }
        catch(e)
        {
            senderFriends = [];
        }
    }


    if (
        senderData &&
        senderData.Data &&
        senderData.Data.OutgoingFriendRequests &&
        senderData.Data.OutgoingFriendRequests.Value
    )
    {
        try
        {
            senderOutgoing =
                JSON.parse(
                    senderData.Data
                        .OutgoingFriendRequests
                        .Value
                );

            if (!Array.isArray(
                senderOutgoing))
            {
                senderOutgoing = [];
            }
        }
        catch(e)
        {
            senderOutgoing = [];
        }
    }


    if (
        senderFriends.indexOf(
            receiverId
        ) === -1
    )
    {
        senderFriends.push(
            receiverId
        );
    }


    senderOutgoing =
        senderOutgoing.filter(
            function(id)
            {
                return id !== receiverId;
            }
        );


    server.UpdateUserInternalData({
        PlayFabId:
            senderId,

        Data:
        {
            Friends:
                JSON.stringify(
                    senderFriends
                ),

            OutgoingFriendRequests:
                JSON.stringify(
                    senderOutgoing
                )
        }
    });


    // =====================================================
    // УВЕДОМЛЕНИЕ О ПРИНЯТИИ
    // Получает тот, кто отправил заявку
    // =====================================================

    AddNotification(
        senderId,
        "friend_accepted",
        receiverId
    );


    log.info(
        "FRIEND REQUEST ACCEPTED"
    );


    return {
        success:
            true,

        friendPlayFabId:
            senderId
    };
};


// ============================================================
// REJECT FRIEND REQUEST
// ============================================================

handlers.rejectFriendRequest = function(
    args,
    context
)
{
    var receiverId =
        currentPlayerId;


    if (
        !args ||
        !args.fromPlayFabId
    )
    {
        return {
            success:
                false,

            error:
                "fromPlayFabId не передан"
        };
    }


    var senderId =
        String(
            args.fromPlayFabId
        ).trim();


    if (!senderId)
    {
        return {
            success:
                false,

            error:
                "fromPlayFabId пустой"
        };
    }


    // =====================================================
    // RECEIVER REQUESTS
    // =====================================================

    var receiverRequests =
        GetInternalList(
            receiverId,
            "FriendRequests"
        );


    var requestExists =
        receiverRequests.indexOf(
            senderId
        ) !== -1;


    if (!requestExists)
    {
        return {
            success:
                false,

            error:
                "Заявка не найдена"
        };
    }


    receiverRequests =
        receiverRequests.filter(
            function(id)
            {
                return id !== senderId;
            }
        );


    SaveInternalList(
        receiverId,
        "FriendRequests",
        receiverRequests
    );


    // =====================================================
    // OUTGOING SENDER
    // =====================================================

    var senderOutgoing =
        GetInternalList(
            senderId,
            "OutgoingFriendRequests"
        );


    senderOutgoing =
        senderOutgoing.filter(
            function(id)
            {
                return id !== receiverId;
            }
        );


    SaveInternalList(
        senderId,
        "OutgoingFriendRequests",
        senderOutgoing
    );


    // =====================================================
    // УВЕДОМЛЕНИЕ ОБ ОТКЛОНЕНИИ
    // =====================================================

    AddNotification(
        senderId,
        "friend_rejected",
        receiverId
    );


    log.info(
        "FRIEND REQUEST REJECTED: " +
        senderId +
        " -> " +
        receiverId
    );


    return {
        success:
            true
    };
};


// ============================================================
// GET FRIENDS
// ============================================================


// ============================================================
// REMOVE FRIEND
// ============================================================

handlers.removeFriend = function(
    args,
    context
)
{
    var currentId =
        currentPlayerId;


    if (
        !args ||
        !args.friendPlayFabId
    )
    {
        return {
            success:
                false,

            error:
                "friendPlayFabId не передан"
        };
    }


    var friendId =
        String(
            args.friendPlayFabId
        ).trim();


    if (!friendId)
    {
        return {
            success:
                false,

            error:
                "friendPlayFabId пустой"
        };
    }


    if (
        currentId ===
        friendId
    )
    {
        return {
            success:
                false,

            error:
                "Нельзя удалить самого себя"
        };
    }


    // =====================================================
    // CURRENT PLAYER
    // =====================================================

    var myFriends =
        GetInternalList(
            currentId,
            "Friends"
        );


    myFriends =
        myFriends.filter(
            function(id)
            {
                return id !== friendId;
            }
        );


    SaveInternalList(
        currentId,
        "Friends",
        myFriends
    );


    // =====================================================
    // SECOND PLAYER
    // =====================================================

    var otherFriends =
        GetInternalList(
            friendId,
            "Friends"
        );


    otherFriends =
        otherFriends.filter(
            function(id)
            {
                return id !== currentId;
            }
        );


    SaveInternalList(
        friendId,
        "Friends",
        otherFriends
    );


    return {
        success:
            true,

        removedFriendPlayFabId:
            friendId
    };
};


// ============================================================
// SEARCH PLAYER BY NICKNAME
// ============================================================

handlers.searchPlayerByNickname =
function(
    args,
    context
)
{
    if (
        !args ||
        !args.nickname
    )
    {
        return {
            success:
                false,

            error:
                "Ник не передан"
        };
    }


    var nickname =
        String(
            args.nickname
        ).trim();


    if (nickname.length < 2)
    {
        return {
            success:
                false,

            error:
                "Слишком короткий ник"
        };
    }


    var normalized =
        nickname.toLowerCase();


    var key =
        "NicknameIndex_" +
        normalized;


    var result =
        server.GetTitleInternalData({
            Keys:
            [
                key
            ]
        });


    if (!result)
    {
        return {
            success:
                false,

            error:
                "GetTitleInternalData вернул null"
        };
    }


    if (
        !result.Data ||
        !result.Data[key] ||
        !result.Data[key].Value
    )
    {
        return {
            success:
                false,

            error:
                "Игрок не найден"
        };
    }


    var playFabId =
        result.Data[key].Value;


    if (
        playFabId ===
        currentPlayerId
    )
    {
        return {
            success:
                false,

            error:
                "Это ваш собственный аккаунт"
        };
    }


    return {
        success:
            true,

        nickname:
            nickname,

        playFabId:
            playFabId
    };
};


// ============================================================
// GET FRIEND PLAYER DATA
// ============================================================

handlers.getFriendPlayerData =
function(
    args,
    context
)
{
    if (
        !args ||
        !args.playFabId
    )
    {
        return {
            success:
                false,

            error:
                "playFabId не передан"
        };
    }


    var playFabId =
        String(
            args.playFabId
        ).trim();


    try
    {
        var profile =
            server.GetPlayerProfile({
                PlayFabId:
                    playFabId,

                ProfileConstraints:
                {
                    ShowDisplayName:
                        true,

                    ShowAvatarUrl:
                        true,

                    ShowLastLogin:
                        true
                }
            });


        var nickname = "";

        var avatarUrl = "";

        var lastLogin = "";


        if (
            profile &&
            profile.PlayerProfile
        )
        {
            var p =
                profile.PlayerProfile;


            if (p.DisplayName)
            {
                nickname =
                    p.DisplayName;
            }


            if (p.AvatarUrl)
            {
                avatarUrl =
                    p.AvatarUrl;
            }


            if (p.LastLogin)
            {
                lastLogin =
                    p.LastLogin;
            }
        }


        // =====================================================
        // FRIENDS
        // =====================================================

        var friends =
            GetInternalList(
                playFabId,
                "Friends"
            );


        return {
            success:
                true,

            playFabId:
                playFabId,

            nickname:
                nickname,

            avatarUrl:
                avatarUrl,

            lastOnline:
                lastLogin,

            friendCount:
                friends.length
        };
    }
    catch(e)
    {
        log.error(
            "getFriendPlayerData ERROR: " +
            e
        );


        return {
            success:
                false,

            playFabId:
                playFabId,

            error:
                String(e)
        };
    }
};


// ============================================================
// UPDATE LAST ONLINE
// ============================================================

handlers.updateLastOnline =
function(
    args,
    context
)
{
    server.UpdateUserReadOnlyData({
        PlayFabId:
            currentPlayerId,

        Data:
        {
            lastOnline:
                new Date().toISOString()
        }
    });


    return {
        success:
            true
    };
};


// ============================================================
// REGISTER NICKNAME INDEX
// ============================================================

handlers.registerNicknameIndex =
function(
    args,
    context
)
{
    if (
        !args ||
        !args.nickname
    )
    {
        return {
            success:
                false,

            error:
                "nickname не передан"
        };
    }


    var nickname =
        String(
            args.nickname
        ).trim();


    if (nickname.length < 9)
    {
        return {
            success:
                false,

            error:
                "Ник слишком короткий"
        };
    }


    var normalized =
        nickname.toLowerCase();


    var key =
        "NicknameIndex_" +
        normalized;


    var oldData =
        server.GetTitleInternalData({
            Keys:
            [
                key
            ]
        });


    if (
        oldData &&
        oldData.Data &&
        oldData.Data[key] &&
        oldData.Data[key].Value
    )
    {
        var oldPlayFabId =
            oldData.Data[key].Value;


        if (
            oldPlayFabId !==
            currentPlayerId
        )
        {
            return {
                success:
                    false,

                error:
                    "Этот ник уже занят"
            };
        }
    }


    server.SetTitleInternalData({
        Key:
            key,

        Value:
            currentPlayerId
    });


    return {
        success:
            true,

        nickname:
            nickname,

        normalized:
            normalized,

        key:
            key,

        playFabId:
            currentPlayerId,

        verified:
            true
    };
};


// ============================================================
// GET NOTIFICATIONS
// ============================================================

handlers.getNotifications =
function(
    args,
    context
)
{
    var notifications =
        GetInternalList(
            currentPlayerId,
            "Notifications"
        );


    log.info(
        "GET NOTIFICATIONS"
    );

    log.info(
        "Player: " +
        currentPlayerId
    );

    log.info(
        "Notifications: " +
        JSON.stringify(
            notifications
        )
    );


    return {
        success:
            true,

        notifications:
            notifications
    };
};


// ============================================================
// REMOVE NOTIFICATION
// ============================================================

handlers.removeNotification =
function(
    args,
    context
)
{
    if (
        !args ||
        !args.notificationId
    )
    {
        return {
            success:
                false,

            error:
                "notificationId не передан"
        };
    }


    var notificationId =
        String(
            args.notificationId
        );


    var notifications =
        GetInternalList(
            currentPlayerId,
            "Notifications"
        );


    notifications =
        notifications.filter(
            function(item)
            {
                return (
                    item &&
                    item.id !==
                    notificationId
                );
            }
        );


    SaveInternalList(
        currentPlayerId,
        "Notifications",
        notifications
    );


    return {
        success:
            true
    };
};

// ============================================================
// SALARY SYSTEM - SERVER AUTHORITATIVE
// ============================================================

// ============================================================
// SALARY SETTINGS
// ============================================================

// ============================================================
// SALARY SYSTEM - SERVER AUTHORITATIVE
// ============================================================

// --------------------------------------------------------------
// ============================================================
// SALARY SYSTEM
// PlayFab Legacy CloudScript
// ============================================================
//
// Валюта: GD
//
// Интервал:
// 20 -> 40 -> 60 -> 80 -> ...
//
// Boost:
// x5 на 10 секунд
//
// InternalData:
// SalaryNextClaimUtc
// SalaryInterval
// AutoSalaryCount
// BoostEndUtc
//
// ============================================================

var SALARY_CURRENCY = "GD";

var START_INTERVAL = 20;
var INTERVAL_STEP = 20;

var SALARY_AMOUNT = 10;

var BOOST_MULTIPLIER = 20;
var BOOST_DURATION = 10;

// ============================================================
// Вспомогательные функции
// ============================================================

function getUtcNow()
{
    return new Date();
}

function getDataValue(data, key, defaultValue)
{
    if (!data || !data.Data)
        return defaultValue;

    if (!data.Data[key])
        return defaultValue;

    if (data.Data[key].Value === undefined ||
        data.Data[key].Value === null)
        return defaultValue;

    return data.Data[key].Value;
}

function parseIntSafe(value, defaultValue)
{
    var result = parseInt(value, 10);

    if (isNaN(result))
        return defaultValue;

    return result;
}

function parseDateSafe(value)
{
    if (!value || value === "")
        return null;

    var date = new Date(value);

    if (isNaN(date.getTime()))
        return null;

    return date;
}


// ============================================================
// Получение данных зарплаты
// ============================================================

handlers.getSalaryData = function(args, context)
{

    var playerId =
        currentPlayerId;


    var data =
        server.GetUserInternalData({
            PlayFabId: playerId,
            Keys:
            [
                "SalaryCoins",
                "NextSalaryUnix",
                "SalaryDuration"
            ]
        });



    var now =
        Math.floor(
            Date.now() / 1000
        );



    var coins = 0;


    if(
        data.Data.SalaryCoins
    )
    {
        coins =
        parseInt(
            data.Data.SalaryCoins.Value
        );
    }



    var nextSalary = 0;


    if(
        data.Data.NextSalaryUnix
    )
    {
        nextSalary =
        parseInt(
            data.Data.NextSalaryUnix.Value
        );
    }




    var duration = 20;



    if(
        data.Data.SalaryDuration
    )
    {
        duration =
        parseInt(
            data.Data.SalaryDuration.Value
        );
    }




    return {

        success:true,


        coins:coins,


        salaryDuration:duration,


        nextSalaryUnix:nextSalary,


        serverUnix:now

    };

};


// ============================================================
// Получение зарплаты
// ============================================================

handlers.claimSalary = function(args, context)
{

    var playerId =
        currentPlayerId;



    var now =
        Math.floor(
            Date.now()/1000
        );



    var reward =
        10;



    if(args.coins)
    {
        reward =
        parseInt(args.coins);
    }



    var data =
        server.GetUserInternalData({

            PlayFabId:playerId,

            Keys:
            [
                "SalaryCoins",
                "NextSalaryUnix",
                "SalaryDuration"
            ]

        });



    var coins = 0;


    if(data.Data.SalaryCoins)
    {

        coins =
        parseInt(
            data.Data.SalaryCoins.Value
        );

    }




    var nextSalary = 0;


    if(data.Data.NextSalaryUnix)
    {

        nextSalary =
        parseInt(
            data.Data.NextSalaryUnix.Value
        );

    }



    //====================================
    // ПРОВЕРКА ТАЙМЕРА
    //====================================


    if(
        now < nextSalary
    )
    {

        return {

            success:false,

            error:
            "Salary not ready",


            coins:coins,


            salaryDuration:20,


            nextSalaryUnix:nextSalary,


            serverUnix:now

        };

    }




    //====================================
    // ДОБАВЛЯЕМ МОНЕТЫ
    //====================================


    coins += reward;



    var duration = 20;




    var newNext =
        now + duration;





    server.UpdateUserInternalData({

        PlayFabId:playerId,


        Data:
        {

            SalaryCoins:
                coins.toString(),


            NextSalaryUnix:
                newNext.toString(),


            SalaryDuration:
                duration.toString()

        }

    });





    return {


        success:true,


        coins:coins,


        salaryDuration:duration,


        nextSalaryUnix:newNext,


        serverUnix:now

    };


};


// ============================================================
// Активация BOOST
// x5 на 10 секунд
// ============================================================

handlers.activateSalaryBoost = function(args, context)
{
    log.info("===== activateSalaryBoost =====");

    if (!currentPlayerId)
    {
        return {
            success: false,
            error: "currentPlayerId отсутствует"
        };
    }

    var now = getUtcNow();

    var data = server.GetUserInternalData({
        PlayFabId: currentPlayerId,

        Keys: [
            "SalaryNextClaimUtc",
            "SalaryInterval",
            "AutoSalaryCount",
            "BoostEndUtc"
        ]
    });

    var nextClaimUtc =
        getDataValue(
            data,
            "SalaryNextClaimUtc",
            ""
        );

    var salaryInterval =
        parseIntSafe(
            getDataValue(
                data,
                "SalaryInterval",
                START_INTERVAL
            ),
            START_INTERVAL
        );

    var autoSalaryCount =
        parseIntSafe(
            getDataValue(
                data,
                "AutoSalaryCount",
                0
            ),
            0
        );

    var boostEndUtc =
        getDataValue(
            data,
            "BoostEndUtc",
            ""
        );

    // --------------------------------------------------------
    // Проверяем старый BOOST
    // --------------------------------------------------------

    if (boostEndUtc && boostEndUtc !== "")
    {
        var oldBoostDate =
            parseDateSafe(boostEndUtc);

        if (oldBoostDate &&
            oldBoostDate.getTime() >
            now.getTime())
        {
            return {
                success: false,

                error:
                    "BOOST_ALREADY_ACTIVE",

                boostRemainingSeconds:
                    Math.ceil(
                        (oldBoostDate.getTime() -
                         now.getTime()) / 1000
                    )
            };
        }
    }

    // --------------------------------------------------------
    // Проверяем таймер
    // --------------------------------------------------------

    var nextDate =
        parseDateSafe(nextClaimUtc);

    if (!nextDate)
    {
        return {
            success: false,
            error: "Таймер зарплаты ещё не создан"
        };
    }

    var remainingMs =
        Math.max(
            0,
            nextDate.getTime() -
            now.getTime()
        );

    var remainingSeconds =
        Math.ceil(
            remainingMs / 1000
        );

    // --------------------------------------------------------
    // BOOST x5 на 10 секунд
    //
    // Обычная скорость:
    // 10 секунд = 10 секунд прогресса
    //
    // x5:
    // 10 секунд = 50 секунд прогресса
    //
    // Дополнительный прогресс:
    // 50 - 10 = 40 секунд
    //
    // Поэтому уменьшаем дедлайн на 40 секунд.
    // --------------------------------------------------------

    var extraProgressSeconds =
        BOOST_DURATION *
        (BOOST_MULTIPLIER - 1);

    var reducedRemainingSeconds =
        Math.max(
            0,
            remainingSeconds -
            extraProgressSeconds
        );

    var newNextDate =
        new Date(
            now.getTime() +
            reducedRemainingSeconds * 1000
        );

    var newNextClaimUtc =
        newNextDate.toISOString();

    // --------------------------------------------------------
    // Конец BOOST
    // --------------------------------------------------------

    var newBoostEndDate =
        new Date(
            now.getTime() +
            BOOST_DURATION * 1000
        );

    var newBoostEndUtc =
        newBoostEndDate.toISOString();

    // --------------------------------------------------------
    // Сохраняем
    // --------------------------------------------------------

    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,

        Data: {
            SalaryNextClaimUtc:
                newNextClaimUtc,

            SalaryInterval:
                salaryInterval,

            AutoSalaryCount:
                autoSalaryCount,

            BoostEndUtc:
                newBoostEndUtc
        }
    });

    return {
        success: true,

        boostMultiplier:
            BOOST_MULTIPLIER,

        boostDuration:
            BOOST_DURATION,

        boostEndUtc:
            newBoostEndUtc,

        salaryNextClaimUtc:
            newNextClaimUtc,

        remainingSeconds:
            reducedRemainingSeconds,

        serverUtcNow:
            now.toISOString()
    };
};


// ============================================================
// AUTO SALARY
//
// Если AutoSalaryCount > 0 и зарплата уже доступна,
// сервер автоматически выдаёт одну зарплату.
//
// AutoSalaryCount уменьшается на 1.
//
// ВАЖНО:
// клиент не говорит серверу сколько GD выдать.
// Сервер сам проверяет таймер.
// ============================================================

handlers.processAutoSalary = function(args, context)
{
    log.info("===== processAutoSalary =====");

    if (!currentPlayerId)
    {
        return {
            success: false,
            error: "currentPlayerId отсутствует"
        };
    }

    var now = getUtcNow();

    var data = server.GetUserInternalData({
        PlayFabId: currentPlayerId,

        Keys: [
            "SalaryNextClaimUtc",
            "SalaryInterval",
            "AutoSalaryCount",
            "BoostEndUtc"
        ]
    });

    var nextClaimUtc =
        getDataValue(
            data,
            "SalaryNextClaimUtc",
            ""
        );

    var salaryInterval =
        parseIntSafe(
            getDataValue(
                data,
                "SalaryInterval",
                START_INTERVAL
            ),
            START_INTERVAL
        );

    var autoSalaryCount =
        parseIntSafe(
            getDataValue(
                data,
                "AutoSalaryCount",
                0
            ),
            0
        );

    var boostEndUtc =
        getDataValue(
            data,
            "BoostEndUtc",
            ""
        );

    // Нет AUTO
    if (autoSalaryCount <= 0)
    {
        return {
            success: false,
            error: "NO_AUTO_SALARY",
            autoSalaryCount: 0
        };
    }

    var nextDate =
        parseDateSafe(nextClaimUtc);

    if (!nextDate)
    {
        return {
            success: false,
            error: "Таймер зарплаты ещё не создан"
        };
    }

    // Зарплата ещё не готова
    if (nextDate.getTime() >
        now.getTime())
    {
        return {
            success: false,

            error:
                "SALARY_NOT_READY",

            remainingSeconds:
                Math.ceil(
                    (nextDate.getTime() -
                     now.getTime()) / 1000
                ),

            autoSalaryCount:
                autoSalaryCount
        };
    }

    // --------------------------------------------------------
    // Начисляем
    // --------------------------------------------------------

    server.AddUserVirtualCurrency({
        PlayFabId: currentPlayerId,

        VirtualCurrency:
            SALARY_CURRENCY,

        Amount:
            SALARY_AMOUNT
    });

    // --------------------------------------------------------
    // Уменьшаем AUTO
    // --------------------------------------------------------

    var newAutoCount =
        Math.max(
            0,
            autoSalaryCount - 1
        );

    // --------------------------------------------------------
    // Увеличиваем интервал
    // --------------------------------------------------------

    var newInterval =
        salaryInterval +
        INTERVAL_STEP;

    // --------------------------------------------------------
    // Следующий таймер
    // --------------------------------------------------------

    var newNextDate =
        new Date(
            now.getTime() +
            newInterval * 1000
        );

    var newNextClaimUtc =
        newNextDate.toISOString();

    // --------------------------------------------------------
    // Сохраняем
    // --------------------------------------------------------

    server.UpdateUserInternalData({
        PlayFabId: currentPlayerId,

        Data: {
            SalaryNextClaimUtc:
                newNextClaimUtc,

            SalaryInterval:
                newInterval,

            AutoSalaryCount:
                newAutoCount,

            BoostEndUtc:
                boostEndUtc
        }
    });

    return {
        success: true,

        amount:
            SALARY_AMOUNT,

        currency:
            SALARY_CURRENCY,

        salaryInterval:
            newInterval,

        salaryNextClaimUtc:
            newNextClaimUtc,

        autoSalaryCount:
            newAutoCount,

        serverUtcNow:
            now.toISOString()
    };
};


// ============================================================
// NOTIFICATIONS
// ============================================================

var NOTIFICATION_KEY = "Notifications";


// ------------------------------------------------------------
// Отправить уведомление конкретному игроку
// ------------------------------------------------------------

handlers.SendNotification = function (args) {

    if (!args)
        throw "Arguments are required";

    var targetPlayFabId = args.targetPlayFabId;
    var message = args.message;

    if (!targetPlayFabId)
        throw "targetPlayFabId is required";

    if (!message)
        throw "message is required";

    message = String(message);

    // Ограничиваем длину сообщения
    if (message.length > 1000)
        throw "Message is too long. Maximum 1000 characters.";

 var senderPlayFabId = currentPlayerId;

    // Получаем существующие уведомления
    var dataResult = server.GetUserReadOnlyData({
        PlayFabId: targetPlayFabId,
        Keys: [NOTIFICATION_KEY]
    });

    var notifications = [];

    try {

        if (dataResult.Data &&
            dataResult.Data[NOTIFICATION_KEY] &&
            dataResult.Data[NOTIFICATION_KEY].Value) {

            notifications =
                JSON.parse(
                    dataResult.Data[NOTIFICATION_KEY].Value
                );

            if (!Array.isArray(notifications))
                notifications = [];
        }

    } catch (e) {

        notifications = [];
    }


    // Создаем новое уведомление

    var notification = {
        id:
            new Date().getTime().toString(),

        text:
            message,

        date:
            new Date().toISOString(),

        read:
            false,

        sender:
            "ADMIN",

       senderPlayFabId: senderPlayFabId
    };


    notifications.push(notification);


    // Храним максимум 50 уведомлений
    // Удаляем самые старые

    if (notifications.length > 50) {

        notifications =
            notifications.slice(
                notifications.length - 50
            );
    }


    // Сохраняем серверные данные
    server.UpdateUserReadOnlyData({

        PlayFabId:
            targetPlayFabId,

        Data: {

            [NOTIFICATION_KEY]:
                JSON.stringify(
                    notifications
                )
        }
    });


    return {

        success: true,

        message:
            "Notification sent",

        notificationId:
            notification.id
    };
};


// ------------------------------------------------------------
// Получить уведомления текущего игрока
// ------------------------------------------------------------

handlers.GetNotifications = function (args) {

    var result =
        server.GetUserReadOnlyData({

            PlayFabId:
                currentPlayerId,

            Keys:
                [NOTIFICATION_KEY]
        });


    var notifications = [];


    try {

        if (result.Data &&
            result.Data[NOTIFICATION_KEY] &&
            result.Data[NOTIFICATION_KEY].Value) {

            notifications =
                JSON.parse(
                    result.Data[NOTIFICATION_KEY].Value
                );

            if (!Array.isArray(notifications))
                notifications = [];
        }

    } catch (e) {

        notifications = [];
    }


    return {

        notifications:
            notifications
    };
};


// ------------------------------------------------------------
// Прочитать уведомление
// ------------------------------------------------------------

handlers.ReadNotification = function (args) {

    if (!args ||
        !args.notificationId) {

        throw "notificationId is required";
    }


    var result =
        server.GetUserReadOnlyData({

            PlayFabId:
                currentPlayerId,

            Keys:
                [NOTIFICATION_KEY]
        });


    var notifications = [];


    try {

        if (result.Data &&
            result.Data[NOTIFICATION_KEY] &&
            result.Data[NOTIFICATION_KEY].Value) {

            notifications =
                JSON.parse(
                    result.Data[NOTIFICATION_KEY].Value
                );
        }

    } catch (e) {

        notifications = [];
    }


    var found = false;


    for (var i = 0;
         i < notifications.length;
         i++) {

        if (
            notifications[i].id ===
            args.notificationId
        ) {

            notifications[i].read =
                true;

            found = true;

            break;
        }
    }


    if (!found) {

        return {

            success: false,

            message:
                "Notification not found"
        };
    }


    server.UpdateUserReadOnlyData({

        PlayFabId:
            currentPlayerId,

        Data: {

            [NOTIFICATION_KEY]:
                JSON.stringify(
                    notifications
                )
        }
    });


    return {

        success: true
    };
};


// ------------------------------------------------------------
// Удалить уведомление
// ------------------------------------------------------------

handlers.DeleteNotification = function (args) {

    if (!args ||
        !args.notificationId) {

        throw "notificationId is required";
    }


    var result =
        server.GetUserReadOnlyData({

            PlayFabId:
                currentPlayerId,

            Keys:
                [NOTIFICATION_KEY]
        });


    var notifications = [];


    try {

        if (result.Data &&
            result.Data[NOTIFICATION_KEY] &&
            result.Data[NOTIFICATION_KEY].Value) {

            notifications =
                JSON.parse(
                    result.Data[NOTIFICATION_KEY].Value
                );
        }

    } catch (e) {

        notifications = [];
    }


    var newNotifications = [];

    var found = false;


    for (var i = 0;
         i < notifications.length;
         i++) {

        if (
            notifications[i].id ===
            args.notificationId
        ) {

            found = true;

        } else {

            newNotifications.push(
                notifications[i]
            );
        }
    }


    if (!found) {

        return {

            success: false,

            message:
                "Notification not found"
        };
    }


    server.UpdateUserReadOnlyData({

        PlayFabId:
            currentPlayerId,

        Data: {

            [NOTIFICATION_KEY]:
                JSON.stringify(
                    newNotifications
                )
        }
    });


    return {

        success: true
    };
};



handlers.SendPlayerCommand = function(args, context)
{ if (!args){throw "args отсутствуют";}
var playerId = args.targetPlayerId;
var command = args.command;if (!playerId){throw "targetPlayerId отсутствует";}
if (!command){throw "command отсутствует";}
server.UpdateUserData({PlayFabId: playerId,Data:{AdminCommand: command} });
return {success: true,playerId: playerId,command: command};};

handlers.ClaimCoins = function (args, context) {
var COINS_AMOUNT = 10; var START_COOLDOWN = 60; var COOLDOWN_INCREASE = 30; var playerId = currentPlayerId;
    var dataResult = server.GetUserReadOnlyData({PlayFabId: playerId,Keys: ["CoinTimerCooldown","NextCoinClaimUtc"]});
    var data = dataResult.Data || {}; var cooldown = START_COOLDOWN;
if (data["CoinTimerCooldown"] && data["CoinTimerCooldown"].Value) {cooldown = parseInt(data["CoinTimerCooldown"].Value);
if (isNaN(cooldown) || cooldown < START_COOLDOWN) {cooldown = START_COOLDOWN;}}
    var now = new Date();


    // =====================================================
    // ПРОВЕРЯЕМ NEXT CLAIM
    // =====================================================

    if (data["NextCoinClaimUtc"] &&
        data["NextCoinClaimUtc"].Value) {

        var nextClaim =
            new Date(
                data["NextCoinClaimUtc"].Value
            );

        if (!isNaN(nextClaim.getTime())) {

            if (now < nextClaim) {

                var remaining =
                    Math.ceil(
                        (
                            nextClaim.getTime() -
                            now.getTime()
                        ) / 1000
                    );

                return {
                    success: false,
                    message: "Награда ещё не готова.",
                    remainingSeconds: remaining,
                    cooldown: cooldown
                };
            }
        }
    }


    // =====================================================
    // НАГРАДА
    // =====================================================

    server.AddUserVirtualCurrency({
        PlayFabId: playerId,

        VirtualCurrency: "GD",

        Amount: COINS_AMOUNT
    });


    // =====================================================
    // НОВЫЙ COOLDOWN
    // =====================================================

    var newCooldown =
        cooldown + COOLDOWN_INCREASE;


    // =====================================================
    // СЛЕДУЮЩЕЕ ВРЕМЯ ПОЛУЧЕНИЯ
    // =====================================================

    var nextClaimTime =
        new Date(
            now.getTime() +
            newCooldown * 1000
        );


    // =====================================================
    // СОХРАНЯЕМ НА СЕРВЕРЕ
    // =====================================================

    server.UpdateUserReadOnlyData({
        PlayFabId: playerId,

        Data: {
            CoinTimerCooldown:
                newCooldown.toString(),

            NextCoinClaimUtc:
                nextClaimTime.toISOString()
        }
    });


    // =====================================================
    // ВОЗВРАЩАЕМ UNITY
    // =====================================================

    return {

        success: true,

        coinsAdded:
            COINS_AMOUNT,

        cooldown:
            newCooldown,

        nextClaimUtc:
            nextClaimTime.toISOString(),

        remainingSeconds:
            newCooldown,

        message:
            "Монеты успешно получены."
    };
};

handlers.GetCoinTimer = function (args, context) {

    var START_COOLDOWN = 60;

    var playerId = currentPlayerId;

    var dataResult =
        server.GetUserReadOnlyData({
            PlayFabId: playerId,

            Keys: [
                "CoinTimerCooldown",
                "NextCoinClaimUtc"
            ]
        });


    var data =
        dataResult.Data || {};


    var cooldown =
        START_COOLDOWN;


    if (data["CoinTimerCooldown"] &&
        data["CoinTimerCooldown"].Value) {

        cooldown =
            parseInt(
                data["CoinTimerCooldown"].Value
            );

        if (isNaN(cooldown)) {
            cooldown =
                START_COOLDOWN;
        }
    }


    var now =
        new Date();


    var nextClaimUtc =
        null;


    var remainingSeconds =
        0;


    if (data["NextCoinClaimUtc"] &&
        data["NextCoinClaimUtc"].Value) {

        nextClaimUtc =
            data["NextCoinClaimUtc"].Value;


        var nextClaim =
            new Date(nextClaimUtc);


        if (!isNaN(nextClaim.getTime())) {

            remainingSeconds =
                Math.max(
                    0,
                    Math.ceil(
                        (
                            nextClaim.getTime() -
                            now.getTime()
                        ) / 1000
                    )
                );
        }
    }


    return {

        success: true,

        cooldown:
            cooldown,

        nextClaimUtc:
            nextClaimUtc,

        remainingSeconds:
            remainingSeconds,

        canClaim:
            remainingSeconds <= 0
    };
};

/// 82 КБ
var INVENTORY_KEY = "CRAFT_INVENTORY";
var META_KEY = "CRAFT_META"; // старый отдельный ключ (только чтение, для совместимости)
var PROP_NAME = "craft_inv";
var RECIPES_KEY = "craft_recipes";
var ADMINS_KEY = "craft_admin_playfabids";
var USE_CAS_KEY = "craft_use_cas";

// Анти-спам (не синхронизация). 0 — отключить.
var MIN_CRAFT_INTERVAL_MS = 600;

// Ограничения
var MAX_ID_LENGTH = 64;
var MAX_RECIPE_AMOUNT = 100000;  // максимум в рецепте
var MAX_GRANT_PER_ITEM = 100000; // максимум за одну выдачу
var MAX_GRANT_ITEMS = 100;       // максимум позиций в одной выдаче
var MAX_DISTINCT_ITEMS = 200;    // максимум разных предметов в инвентаре
var MAX_ATTEMPTS_KEPT = 10;      // сколько последних попыток крафта хранить
var MAX_GRANTS_KEPT = 10;        // сколько последних операций выдачи хранить
var MAX_ATTEMPT_MSG_LENGTH = 80; // длина сохраняемого сообщения попытки
var CAS_RETRIES = 3;             // число попыток записи при конфликте версий

// Коды ошибок PlayFab Player Custom Properties
var PROP_ERROR_NAME_TOO_LONG = 19000;
var PROP_ERROR_VALUE_TOO_LONG = 19002;
var PROP_ERROR_VERSION_MISMATCH = 19004;
var PROP_ERROR_PROPERTY_DOES_NOT_EXIST = 19007;

// ----------------------------------------------------------------------------
//  Базовые функции
// ----------------------------------------------------------------------------

function trimId(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/^\s+|\s+$/g, "");
}

function toInt(value) {
    var n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
}

// Строго целые положительные числа: "2", 2 → ок; "2.5", 2.5, "abc" → нет
function isPositiveInt(value) {
    var n = toInt(value);
    return n > 0 && String(n) === String(value);
}

var RESERVED_ITEM_IDS = {
    "items": true, "lastCraftMs": true, "attempts": true, "grants": true
};

function isValidItemId(value) {
    if (typeof value !== "string") return false;
    if (value.length === 0 || value.length > MAX_ID_LENGTH) return false;
    if (value.charAt(0) === "_") return false;
    if (/\s/.test(value)) return false;
    if (!/^[A-Za-z0-9_.\-]+$/.test(value)) return false;
    return !RESERVED_ITEM_IDS[value];
}

// attemptId обязателен: непустая строка до 64 символов из латиницы/цифр/дефисов
// (формат GUID клиента)
function isValidAttemptId(value) {
    if (typeof value !== "string") return false;
    if (value.length === 0 || value.length > MAX_ID_LENGTH) return false;
    return /^[A-Za-z0-9\-]+$/.test(value);
}

function emptyState() {
    return { items: {}, lastCraftMs: 0, attempts: [], grants: [], creations: {}, chestLastOpenMs: 0, chestClaimSequence: 0, lastSuccessfulAttemptId: null, lastSuccessfulAttemptResult: null };
}

// Копирует счётчики предметов во внутренний словарь. Возвращает false, если
// встретился вложенный объект вместо счётчика (признак повреждения данных).
function copyCounts(from, to) {
    var valid = true;

    for (var key in from) {
        if (!from.hasOwnProperty(key)) continue;

        var value = from[key];

        if (value && typeof value === "object") {
            valid = false; // объект/массив вместо числа — повреждение
            continue;
        }

        var id = trimId(key);

        if (!isValidItemId(id)) continue;

        var count = toInt(value);

        if (count > 0) to[id] = count;
    }

    return valid;
}

function errText(e) {
    if (!e) return "";
    if (e.message) return String(e.message);
    if (e.error) return String(e.error);
    if (typeof e === "string") return e;
    try {
        return JSON.stringify(e);
    } catch (e2) {
        return "";
    }
}

function snippet(text) {
    var s = String(text || "");
    return s.length > 200 ? s.substring(0, 200) + "…" : s;
}

// ----------------------------------------------------------------------------
//  Диагностика повреждённых данных.
//  В лог пишется ТОЛЬКО место и причина — без содержимого данных игрока.
// ----------------------------------------------------------------------------

function logCorruptStorage(storage, reason) {
    var message = "[Crafting] Повреждённые данные инвентаря в хранилище " +
        storage +
        (reason ? ": " + reason : " (детали недоступны)");

    if (typeof console.error === "function") {
        console.error(message);
    } else {
        console.log(message);
    }
}

// ----------------------------------------------------------------------------
//  Разбор состояния инвентаря.
//
//  Различает четыре случая:
//    kind: "missing"  — хранилище отсутствует (данных нет);
//    kind: "ok"       — валидный JSON (пустой или непустой инвентарь);
//    kind: "corrupt"  — данные существуют, но разбираются с ошибкой.
//
//  Повреждённые данные блокируют крафт и выдачу и не перезаписываются.
// ----------------------------------------------------------------------------

function parseStateResult(raw) {
    if (raw === null || raw === undefined) {
        return { kind: "missing", state: emptyState() };
    }

    var text = trimId(String(raw));

    if (text.length === 0) {
        return { kind: "missing", state: emptyState() };
    }

    var parsed;

    try {
        parsed = JSON.parse(text);
    } catch (e) {
        return {
            kind: "corrupt",
            state: emptyState(),
            reason: "JSON: " + snippet(e ? e.message : "")
        };
    }

    if (!parsed || typeof parsed !== "object" || parsed instanceof Array) {
        return {
            kind: "corrupt",
            state: emptyState(),
            reason: "ожидается объект, получено: " +
                snippet(Object.prototype.toString.call(parsed))
        };
    }

    var isPacked =
        parsed.hasOwnProperty("items") ||
        parsed.hasOwnProperty("lastCraftMs") ||
        parsed.hasOwnProperty("attempts");

    if (isPacked) {
        var items = parsed.items;

        if (!items || typeof items !== "object" ||
            (items instanceof Array)) {
            return {
                kind: "corrupt",
                state: emptyState(),
                reason: "\"items\" не является объектом"
            };
        }

        var state = emptyState();

        state.lastCraftMs = toInt(parsed.lastCraftMs);
        state.chestLastOpenMs = toInt(parsed.chestLastOpenMs);
        state.chestClaimSequence = toInt(parsed.chestClaimSequence);
        state.lastSuccessfulAttemptId = parsed.lastSuccessfulAttemptId || null;
        state.lastSuccessfulAttemptResult = parsed.lastSuccessfulAttemptResult || null;

        if (parsed.attempts instanceof Array) {
            state.attempts = parsed.attempts;
        }

        // история операций выдачи (защита от повторного GrantCraftItems);
        // некорректный формат игнорируется — совместимость со старыми данными
        if (parsed.grants instanceof Array) {
            state.grants = parsed.grants;
        }

        // коллекция "Мои творения" — восстанавливается из сохранённого JSON.
        // Без этой строки creations теряется при чтении из любого хранилища.
        if (parsed.creations && typeof parsed.creations === "object" &&
            !(parsed.creations instanceof Array)) {
            state.creations = parsed.creations;
        }

        if (!copyCounts(items, state.items)) {
            return { kind: "corrupt", state: emptyState(), reason: "счётчики повреждены" };
        }

        return { kind: "ok", state: state };
    }

    // старый плоский формат {"rose_seed": 1}
    var flatState = emptyState();

    if (!copyCounts(parsed, flatState.items)) {
        return { kind: "corrupt", state: emptyState(), reason: "счётчики повреждены" };
    }

    return { kind: "ok", state: flatState };
}

// ----------------------------------------------------------------------------

function logStateCorrupt(storage, parsed) {
    logCorruptStorage(storage, parsed && parsed.reason);
}

// ----------------------------------------------------------------------------
//  Title Data
// ----------------------------------------------------------------------------

function getTitleData(key) {
    var response = server.GetTitleData({ Keys: [key] });

    if (!response || !response.Data || !response.Data[key]) return "";

    return String(response.Data[key]);
}

function loadRecipes() {
    var raw = getTitleData(RECIPES_KEY);

    if (!raw) return null;

    var json;

    try {
        json = JSON.parse(raw);
    } catch (e) {
        return null;
    }

    if (!json || !json.recipes || !json.recipes.length) return null;

    // отсеиваем повреждённые записи, чтобы один битый рецепт не ломал всё
    var recipes = [];

    for (var i = 0; i < json.recipes.length; i++) {
        if (json.recipes[i] && typeof json.recipes[i] === "object") {
            recipes.push(json.recipes[i]);
        }
    }

    return recipes.length ? recipes : null;
}

function findRecipe(recipes, recipeId) {
    for (var i = 0; i < recipes.length; i++) {
        if (trimId(recipes[i].id) === recipeId) return recipes[i];
    }

    return null;
}

function isAdmin(playFabId) {
    var raw = getTitleData(ADMINS_KEY);

    if (!raw) return false;

    var ids = raw.split(",");

    for (var i = 0; i < ids.length; i++) {
        if (trimId(ids[i]) === playFabId) return true;
    }

    return false;
}

// Проверка администратора для клиентской админки (AdminPanel.cs).
// Используется тот же список Title Data craft_admin_playfabids.
handlers.isAdmin = function (args, context) {
    return { isAdmin: isAdmin(currentPlayerId) };
};

// ----------------------------------------------------------------------------
//  Классификация ошибок PlayFab API
// ----------------------------------------------------------------------------

// Текстовый и числовой коды конфликтов ExpectedPropertiesVersion.
// Предпочтение — надёжному коду ошибки; текстовый поиск — только fallback
// для непредвиденной формы ошибки.
function isVersionConflict(e) {
    if (!e) return false;

    if (e.errorCode === PROP_ERROR_VERSION_MISMATCH) return true;

    var codeLike = [ e.error, e.errorCode + "", e.name, e.code, e.status ];

    for (var i = 0; i < codeLike.length; i++) {
        if (codeLike[i] === "PlayerCustomPropertiesVersionMismatch") return true;
    }

    var text = errText(e);

    return text.indexOf("VersionMismatch") !== -1 ||
           text.indexOf("19004") !== -1;
}

// Свойства нет вовсе (норма до первого крафта) — детерминированное отсутствие,
// а не временный сбой
function isPropertyMissing(e) {
    if (!e) return false;

    if (e.errorCode === PROP_ERROR_PROPERTY_DOES_NOT_EXIST) return true;

    var codeLike = [ e.error, e.name, e.code ];

    for (var i = 0; i < codeLike.length; i++) {
        if (codeLike[i] === "PlayerCustomPropertiesPropertyDoesNotExist") return true;
    }

    return errText(e).indexOf("PropertyDoesNotExist") !== -1;
}

// ----------------------------------------------------------------------------
//  Хранилище состояния
// ----------------------------------------------------------------------------

function propsAvailable() {
    return typeof server.GetPlayerCustomProperty === "function" &&
           typeof server.UpdatePlayerCustomProperties === "function";
}

// CAS включён, если API Custom Properties доступен и его не отключили в Title Data
function casEnabled() {
    if (!propsAvailable()) return false;

    var flag = getTitleData(USE_CAS_KEY);

    if (!flag) return true;

    flag = flag.toLowerCase();

    return flag !== "false" && flag !== "0";
}

// Режим выбирается один раз за вызов только по проверяемым фактам
// (API доступен + CAS не отключён). Ошибки выполнения НЕ влияют на выбор.
function decideStorageMode() {
    return casEnabled() ? "props" : "rot";
}

// Read-Only Data: тот же JSON состояния (также используется как зеркало CAS-режима).
// Результат: { ok, state, hasData } | { corrupt: true, error } | { ok:false, error }
function loadRot(playFabId) {
    try {
        var response = server.GetUserReadOnlyData({
            PlayFabId: playFabId,
            Keys: [INVENTORY_KEY, META_KEY]
        });

        var raw = "";
        var rawMeta = "";

        if (response && response.Data) {
            if (response.Data[INVENTORY_KEY]) {
                raw = response.Data[INVENTORY_KEY].Value || "";
            }
            if (response.Data[META_KEY]) {
                rawMeta = response.Data[META_KEY].Value || "";
            }
        }

        var parsed = parseStateResult(raw);

        if (parsed.kind === "corrupt") {
            logStateCorrupt(INVENTORY_KEY + " (User Read-Only Data)", parsed);
            return { corrupt: true, error: "инвентарь повреждён" };
        }

        var state = parsed.state; // missing → пустой инвентарь

        // совместимость со старым отдельным ключом CRAFT_META;
        // повреждённая META не блокирует работу — это вспомогательные данные
        if (state.lastCraftMs === 0 && rawMeta) {
            try {
                var meta = JSON.parse(rawMeta);

                if (meta && typeof meta === "object") {
                    state.lastCraftMs = toInt(meta.lastCraftMs);
                }
            } catch (e) {
                // повреждённый CRAFT_META игнорируем
            }
        }

        return { ok: true, state: state, version: 0, hasData: raw.length > 0 };
    } catch (e) {
        return { ok: false, error: errText(e) };
    }
}

function saveRot(playFabId, newState) {
    try {
        var response = server.UpdateUserReadOnlyData({
            PlayFabId: playFabId,
            Permission: "Public",
            Data: {
                CRAFT_INVENTORY: JSON.stringify(newState)
            }
        });

        if (response && typeof response.DataVersion === "number") {
            return { ok: true };
        }

        return { ok: false, conflict: false, error: "нет ответа UpdateUserReadOnlyData" };
    } catch (e) {
        return { ok: false, conflict: false, error: errText(e) };
    }
}

// Player Custom Property.
// Результат: { ok, state, version, hasProperty } | { corrupt: true, error } |
//            { ok:false, error, conflict }
// Автоматический fallback НЕ выполняется — вызывающий код сам решает.
function loadProps(playFabId) {
    try {
        var response = server.GetPlayerCustomProperty({
            PlayFabId: playFabId,
            PropertyName: PROP_NAME
        });

        var version = 0;

        if (response && typeof response.PropertiesVersion === "number") {
            version = response.PropertiesVersion;
        }

        var hasProperty = !!(response && response.Property &&
                             response.Property.Name === PROP_NAME);

        var raw = hasProperty ? String(response.Property.Value || "") : "";
        var parsed = parseStateResult(raw);

        if (parsed.kind === "corrupt") {
            logStateCorrupt(PROP_NAME + " (Player Custom Properties)", parsed);
            return { corrupt: true, error: "инвентарь повреждён" };
        }

        return {
            ok: true,
            state: parsed.state, // missing → пустой инвентарь
            version: version,
            hasProperty: hasProperty
        };
    } catch (e) {
        // свойство ещё не создано — это не сбой, а нормальное отсутствие
        if (isPropertyMissing(e)) {
            return { ok: true, state: emptyState(), version: 0, hasProperty: false };
        }

        return { ok: false, error: errText(e), conflict: isVersionConflict(e) };
    }
}

function saveProps(playFabId, newState, expectedVersion) {
    try {
        var response = server.UpdatePlayerCustomProperties({
            PlayFabId: playFabId,
            ExpectedPropertiesVersion: expectedVersion,
            Properties: [
                { Name: PROP_NAME, Value: JSON.stringify(newState) }
            ]
        });

        if (response && typeof response.PropertiesVersion === "number") {
            return { ok: true };
        }

        return { ok: false, conflict: false, error: "нет ответа UpdatePlayerCustomProperties" };
    } catch (e) {
        return { ok: false, conflict: isVersionConflict(e), error: errText(e) };
    }
}

// Зеркало в Read-Only Data — только для Game Manager и клиентского
// безопасного чтения; записи в него никогда не засчитывается как успешный
// крафт/выдача.
function mirrorToRot(playFabId, newState) {
    try {
        server.UpdateUserReadOnlyData({
            PlayFabId: playFabId,
            Permission: "Public",
            Data: {
                CRAFT_INVENTORY: JSON.stringify(newState)
            }
        });
    } catch (e) {
        // зеркало — вспомогательное, на результат крафта не влияет
    }
}

// Читает состояние из ОСНОВНОГО хранилища выбранного режима.
// В CAS-режиме при первом обращении игрока (свойство ещё не создано)
// переносит данные из Read-Only Data. Ошибка ВТОРИЧНОГО чтения во время
// переноса прерывает операцию: писать вычисленный результат поверх
// непроверенного состояния нельзя.
// Результат: { ok:true, state, version, mode } |
//            { corrupt: true, error } | { ok:false, error }
function readState(playFabId, mode) {
    if (mode !== "props") {
        var rot = loadRot(playFabId);

        if (rot.ok) rot.mode = mode;
        return rot;
    }

    var props = loadProps(playFabId);

    if (props.corrupt || !props.ok) return props;

    if (props.hasProperty) {
        props.mode = mode;
        return props;
    }

    // перенос старых данных из Read-Only Data (bootstrap)
    var rot = loadRot(playFabId);

    if (rot.corrupt) {
        logStateCorrupt(PROP_NAME + " (Player Custom Properties)",
            { reason: "перенос: " + (rot.error || "Read-Only Data повреждён") });
        rot.mode = mode;
        return rot;
    }

    if (!rot.ok) {
        // нельзя переносить то, что не удалось прочитать: операция прерывается
        rot.mode = mode;
        return rot;
    }

    if (rot.hasData) {
        props.state = rot.state;
    }

    props.mode = mode;
    return props;
}

function save(playFabId, mode, newState, expectedVersion) {
    if (mode === "props") {
        return saveProps(playFabId, newState, expectedVersion);
    }

    return saveRot(playFabId, newState);
}

// Текущие предметы из основного хранилища; null, если прочитать не удалось.
function readCurrentItems(playFabId, mode) {
    var current = readState(playFabId, mode);

    if (current.corrupt || !current.ok) return null;

    return current.state.items;
}

// ----------------------------------------------------------------------------
//  Единый цикл изменения состояния (CAS-конкуренция)
//
//  compute(state) возвращает:
//    { final: {...} }                       — готовый ответ, ничего не сохраняем;
//    { save: new_state, result: {...} }     — сохранить new_state и вернуть result.
//
//  Гарантии:
//    * повреждённые данные → операция запрещена, данные не перезаписываются;
//    * сбой чтения ОСНОВНОГО хранилища → stateKnown=false, без переключения
//      на резервное;
//    * конфликт CAS → перечитывается основной источник, операция
//      пересчитывается (лимит CAS_RETRIES);
//    * успешным считается только ответ после успешной записи В ОСНОВНОЕ
//      хранилище.
// ----------------------------------------------------------------------------

function runStateUpdate(playFabId, compute) {
    var mode = decideStorageMode();
    var current = readState(playFabId, mode);

    for (var tryCount = 0; tryCount < CAS_RETRIES; tryCount++) {

        // повреждённые данные: операция запрещена, перезапись запрещена
        if (current.corrupt) {
            return {
                success: false,
                stateKnown: true,
                corrupt: true,
                message: "Операция заблокирована: данные инвентаря повреждены. " +
                    "Сообщите администраторам."
            };
        }

        // не удалось надёжно определить состояние основного хранилища:
        // НЕ переключаемся на резервное, операции прекращаются
        if (!current.ok) {
            return {
                success: false,
                stateKnown: false,
                message: "Не удалось прочитать инвентарь. Повторите попытку позже.",
                readError: snippet(current.error)
            };
        }

        var outcome = compute(current.state);

        if (outcome && outcome.final) {
            return outcome.final;
        }

        // сохраняем newState, вычисленный в compute (outcome.save);
        // ExpectedPropertiesVersion — от прочитанного состояния
        var saveResult = save(playFabId, mode, outcome.save, current.version);

        if (saveResult.ok) {
            // зеркало в Read-Only Data — вспомогательное, после успешной записи
            // в основное хранилище
            if (mode === "props") {
                mirrorToRot(playFabId, outcome.save);
            }

            return outcome.result;
        }

        if (saveResult.conflict) {
            // чужая конкурентная запись: перечитываем ОСНОВНОЙ источник —
            // не устаревшую копию — и пересчитываем операцию
            current = readState(playFabId, mode);
            continue;
        }

        // запись не прошла: ничего не применилось, состояние неизвестно
        return {
            success: false,
            stateKnown: false,
            message: "Не удалось сохранить инвентарь на сервере",
            saveError: snippet(saveResult.error)
        };
    }

    var freshItems = readCurrentItems(playFabId, mode);

    var response = {
        success: false,
        message: "Инвентарь изменён параллельно. Повторите попытку."
    };

    if (freshItems !== null) {
        // наш запрос ничего не применил; показываем актуальные данные другим
        response.stateKnown = true;
        response.items = freshItems;
    } else {
        response.stateKnown = false;
    }

    return response;
}

function findAttempt(state, attemptId) {
    if (!attemptId || !state.attempts) return null;

    for (var i = 0; i < state.attempts.length; i++) {
        var attempt = state.attempts[i];

        if (attempt && attempt.id === attemptId) return attempt;
    }

    return null;
}

function shortenMsg(text) {
    var m = String(text || "");
    return m.length > MAX_ATTEMPT_MSG_LENGTH
        ? m.substring(0, MAX_ATTEMPT_MSG_LENGTH)
        : m;
}

function rememberAttempt(state, attemptId, recipeId, ok, message, itemId, amount) {
    if (!attemptId) return;

    if (!(state.attempts instanceof Array)) {
        state.attempts = [];
    }

    state.attempts.push({
        id: attemptId,
        recipe: recipeId, // для проверки: тот же attemptId с другим рецептом
        ok: ok === true,
        msg: shortenMsg(message),
        itemId: itemId || "",
        amount: amount ? toInt(amount) : 0
    });

    // храним только последние попытки
    if (state.attempts.length > MAX_ATTEMPTS_KEPT) {
        state.attempts = state.attempts.slice(state.attempts.length - MAX_ATTEMPTS_KEPT);
    }
}

// защита от повторного применения одной операции выдачи
function findGrant(state, grantId) {
    if (!grantId || !state.grants) return null;

    for (var i = 0; i < state.grants.length; i++) {
        var entry = state.grants[i];

        if (entry && entry.id === grantId) return entry;
    }

    return null;
}

function rememberGrant(state, grantId, message) {
    if (!grantId) return;

    if (!(state.grants instanceof Array)) {
        state.grants = [];
    }

    state.grants.push({
        id: grantId,
        ok: true,
        msg: shortenMsg(message)
    });

    // храним только последние операции
    if (state.grants.length > MAX_GRANTS_KEPT) {
        state.grants = state.grants.slice(state.grants.length - MAX_GRANTS_KEPT);
    }
}

// ----------------------------------------------------------------------------
//  GetCraftInventory — диагностика: инвентарь вызывающего игрока
// ----------------------------------------------------------------------------

handlers.GetCraftInventory = function (args, context) {
    var mode = decideStorageMode();
    var current = readState(currentPlayerId, mode);

    if (current.corrupt) {
        return {
            success: false,
            stateKnown: true,
            corrupt: true,
            message: "Данные инвентаря повреждены. Сообщите администраторам."
        };
    }

    if (!current.ok) {
        return {
            success: false,
            stateKnown: false,
            message: "Не удалось прочитать инвентарь",
            readError: snippet(current.error)
        };
    }

    // ДИАГНОСТИКА: creations после чтения
    if (typeof console !== "undefined" && console.log) {
        console.log("[CraftDiag] GetCraftInventory creations read: mode=" + current.mode +
            ", creations=" + JSON.stringify(current.state.creations));
    }

    return {
        success: true,
        stateKnown: true,
        source: current.mode,
        items: current.state.items,
        creations: current.state.creations || {}
    };
};

// ----------------------------------------------------------------------------
//  CraftItem — крафт
//  args: { recipeId: "red_rose", attemptId: "идентификатор попытки (обязателен)" }
// ----------------------------------------------------------------------------

handlers.CraftItem = function (args, context) {

    // ---- attemptId обязателен: проверяется до любого изменения инвентаря ----
    var attemptId = trimId(args && args.attemptId ? String(args.attemptId) : "");

    if (!isValidAttemptId(attemptId)) {
        return {
            success: false,
            stateKnown: true,
            attemptIdRequired: true,
            message: "Отсутствует attemptId попытки или он записан " +
                "в неверном формате. Обновите игру."
        };
    }

    var recipeId = trimId(args && args.recipeId);

    if (!recipeId) {
        return { success: false, stateKnown: true, message: "Не указан рецепт" };
    }

    var recipes = loadRecipes();

    if (!recipes) {
        return {
            success: false,
            stateKnown: true,
            message: "Рецепты не настроены в Title Data (" + RECIPES_KEY + ")"
        };
    }

    var recipe = findRecipe(recipes, recipeId);

    if (!recipe) {
        return { success: false, stateKnown: true, message: "Рецепт не найден: " + recipeId };
    }

    if (recipe.enabled === false) {
        return { success: false, stateKnown: true, message: "Рецепт отключён" };
    }

    // ---- валидация результата ----
    var result = recipe.result || {};
    var resultId = trimId(result.itemId);
    var resultAmount = toInt(result.amount);

    if (!isValidItemId(resultId) || !isPositiveInt(result.amount)) {
        return { success: false, stateKnown: true, message: "Некорректный результат рецепта" };
    }

    if (resultAmount > MAX_RECIPE_AMOUNT) {
        return { success: false, stateKnown: true, message: "Слишком большое количество результата" };
    }

    // ---- валидация и АГРЕГАЦИЯ ингредиентов ----
    // Повторяющийся в рецепте itemId считается один раз: суммарное количество.
    var ingredients = recipe.ingredients || [];

    if (!ingredients.length) {
        return { success: false, stateKnown: true, message: "У рецепта нет ингредиентов" };
    }

    var required = {};
    var i, ing, id, amount;

    for (i = 0; i < ingredients.length; i++) {
        ing = ingredients[i];

        id = trimId(ing && ing.itemId);
        amount = toInt(ing && ing.amount);

        if (!isValidItemId(id) ||
            !(ing && isPositiveInt(ing.amount)) ||
            amount > MAX_RECIPE_AMOUNT) {
            return {
                success: false,
                stateKnown: true,
                message: "Некорректный ингредиент рецепта: " + (id || "?")
            };
        }

        required[id] = toInt(required[id]) + amount;
    }

    if (Object.keys(required).length > MAX_DISTINCT_ITEMS) {
        return { success: false, stateKnown: true, message: "Слишком много ингредиентов в рецепте" };
    }

    // ---- чтение, проверка, вычисление и сохранение ----
    return runStateUpdate(currentPlayerId, function (state) {

        // 1) повтор уже обработанной попытки — ничего не списываем.
        // Тот же attemptId с ДРУГИМ рецептом — ошибка: попытка привязана
        // к своему рецепту и не может «прогнать» чужой.
        var cached = findAttempt(state, attemptId);

        if (cached) {
            // у попытки может быть только один рецепт: retry того же
            // attemptId с другим рецептом — ошибка запроса
            if (cached.recipe && cached.recipe !== recipeId) {
                return {
                    final: {
                        success: false,
                        stateKnown: true,
                        message: "attemptId уже использован для рецепта \"" +
                            cached.recipe + "\". Повторите крафт обычным способом.",
                        items: state.items
                    }
                };
            }

            return {
                final: {
                    success: cached.ok === true,
                    stateKnown: true,
                    message: (cached.msg || "") +
                        " (повтор запроса — изменений нет)",
                    items: state.items
                }
            };
        }

        // 2) антиспам (только защита от двойных нажатий, не блокировка)
        var now = new Date().getTime();

        if (MIN_CRAFT_INTERVAL_MS > 0 &&
            state.lastCraftMs > 0 &&
            now - state.lastCraftMs < MIN_CRAFT_INTERVAL_MS) {
            return {
                final: {
                    success: false,
                    stateKnown: true,
                    message: "Слишком часто. Подождите немного.",
                    items: state.items
                }
            };
        }

        // 3) проверка наличия — ДО изменения данных
        var have, need;

        for (id in required) {
            if (!required.hasOwnProperty(id)) continue;

            have = toInt(state.items[id]);
            need = required[id];

            if (have < need) {
                return {
                    final: {
                        success: false,
                        stateKnown: true,
                        message: "Не хватает: " + id + " (нужно " + need + ", есть " + have + ")",
                        items: state.items
                    }
                };
            }
        }

        // 4) вычисление нового инвентаря в памяти
        var resultItems = {};

        for (var key in state.items) {
            if (state.items.hasOwnProperty(key)) {
                resultItems[key] = toInt(state.items[key]);
            }
        }

        for (id in required) {
            if (!required.hasOwnProperty(id)) continue;

            resultItems[id] = toInt(resultItems[id]) - required[id];

            if (resultItems[id] <= 0) {
                delete resultItems[id];
            }
        }

        resultItems[resultId] = toInt(resultItems[resultId]) + resultAmount;

        // страховка целостности: отрицательных значений быть не может
        for (key in resultItems) {
            if (resultItems.hasOwnProperty(key) && resultItems[key] < 0) {
                return {
                    final: {
                        success: false,
                        stateKnown: true,
                        message: "Ошибка вычисления инвентаря",
                        items: state.items
                    }
                };
            }
        }

        if (Object.keys(resultItems).length > MAX_DISTINCT_ITEMS) {
            return {
                final: {
                    success: false,
                    stateKnown: true,
                    message: "Слишком много разных предметов в инвентаре",
                    items: state.items
                }
            };
        }

        var message = "Создано: " + resultId + " ×" + resultAmount;

        // ================================================================
        // Обновление коллекции "Мои творения" — только при успешном крафте.
        // Коллекция хранится в том же JSON-состоянии, что и инвентарь, и
        // сохраняется одной атомарной CAS-записью вместе с items/attempts.
        // Повторный attemptId возвращается на шаге 1 (кэш) — здесь не доходит,
        // поэтому двойного начисления не происходит.
        // ================================================================
        if (!state.creations || typeof state.creations !== "object") {
            state.creations = {};
        }

        // ДИАГНОСТИКА: creations до обновления
        if (typeof console !== "undefined" && console.log) {
            console.log("[CraftDiag] CraftItem creations before update: " +
                JSON.stringify(state.creations));
        }

        var nowMs = new Date().getTime();
        var existing = state.creations[resultId];

        if (existing) {
            existing.quantity = toInt(existing.quantity) + resultAmount;
            existing.totalCrafted = toInt(existing.totalCrafted) + resultAmount;
            existing.lastCraftedAt = nowMs;
        } else {
            state.creations[resultId] = {
                itemId: resultId,
                quantity: resultAmount,
                totalCrafted: resultAmount,
                firstCraftedAt: nowMs,
                lastCraftedAt: nowMs
            };
        }

        // ДИАГНОСТИКА: creations после обновления
        if (typeof console !== "undefined" && console.log) {
            console.log("[CraftDiag] CraftItem creations after update: " +
                JSON.stringify(state.creations));
        }

        var newState = {
            items: resultItems,
            lastCraftMs: now,
            attempts: state.attempts,
            grants: state.grants,
            creations: state.creations,
            chestLastOpenMs: state.chestLastOpenMs,
            chestClaimSequence: state.chestClaimSequence,
            lastSuccessfulAttemptId: state.lastSuccessfulAttemptId,
            lastSuccessfulAttemptResult: state.lastSuccessfulAttemptResult
        };

        // ДИАГНОСТИКА: state перед CAS
        if (typeof console !== "undefined" && console.log) {
            console.log("[CraftDiag] CraftItem state before save: " +
                JSON.stringify({ itemsCount: Object.keys(newState.items).length,
                                 creations: newState.creations,
                                 lastCraftMs: newState.lastCraftMs }));
        }

        rememberAttempt(newState, attemptId, recipeId, true, message);

        return {
            save: newState,
            result: {
                success: true,
                stateKnown: true,
                message: message,
                resultItemId: resultId,
                resultAmount: resultAmount,
                items: resultItems,
                creations: state.creations
            }
        };
    });
};

// ----------------------------------------------------------------------------
//  GrantCraftItems — выдача предметов администратором.
//
//  Авторизация ТОЛЬКО по вызывающему игроку (currentPlayerId) и списку
//  craft_admin_playfabids из Title Data. Клиент не может назначить сам себя
//  администратором или выбрать произвольный целевой PlayFabId: список прав
//  задаётся ТОЛЬКО в Title Data, а выдача всегда идёт игроку, от чьего запроса
//  выполнена функция.
//
//  Защита от повтора (идемпотентность):
//    args.grantId  — необязательный идентификатор операции (латиница/цифры/
//                    дефисы, до 64 симв.).
//    * Если операция с таким grantId уже выполнялась (история хранится в
//      состоянии), выдача НЕ повторяется — возвращается сохранённый результат.
//    * Проверка grantId и изменение инвентаря выполняются атомарно: и то, и
//      другое — в одной CAS-записи состояния (runStateUpdate).
//    * Без grantId поведение прежнее (каждый вызов выдаёт предметы).
//
//  args: { items: { "rose_seed": 5, "flower_pot": 1 }, grantId: "id-операции" }
// ----------------------------------------------------------------------------

handlers.GrantCraftItems = function (args, context) {
    var adminsRaw = getTitleData(ADMINS_KEY);

    if (!adminsRaw) {
        return {
            success: false,
            stateKnown: true,
            message: "Список администраторов не настроен в Title Data (" + ADMINS_KEY + ")"
        };
    }

    if (!isAdmin(currentPlayerId)) {
        return {
            success: false,
            stateKnown: true,
            message: "Выдавать предметы может только администратор"
        };
    }

    // идентификатор операции выдачи (для защиты от повтора)
    var grantId = trimId(args && args.grantId ? String(args.grantId) : "");

    if (grantId !== "" && !isValidAttemptId(grantId)) {
        return {
            success: false,
            stateKnown: true,
            message: "Некорректный grantId (латиница/цифры/дефисы, до 64 символов)"
        };
    }

    var add = args && args.items ? args.items : null;

    if (!add || typeof add !== "object" || add instanceof Array) {
        return {
            success: false,
            stateKnown: true,
            message: "Не указаны предметы: { items: { \"itemId\": количество } }"
        };
    }

    var additions = [];
    var added = 0;
    var key, id, amount;

    for (key in add) {
        if (!add.hasOwnProperty(key)) continue;

        id = trimId(key);
        amount = toInt(add[key]);

        if (!isValidItemId(id) ||
            !isPositiveInt(add[key]) ||
            amount > MAX_GRANT_PER_ITEM) {
            return {
                success: false,
                stateKnown: true,
                message: "Некорректный предмет или количество: " + (id || "?") + " ×" + String(add[key])
            };
        }

        additions.push({ itemId: id, amount: amount });
        added += amount;

        if (additions.length > MAX_GRANT_ITEMS) {
            return {
                success: false,
                stateKnown: true,
                message: "Слишком много предметов в одной выдаче"
            };
        }
    }

    if (added <= 0) {
        return { success: false, stateKnown: true, message: "Нечего выдавать" };
    }

    return runStateUpdate(currentPlayerId, function (state) {

        // 1) повтор той же операции выдачи — изменений нет
        var cachedGrant = findGrant(state, grantId);

        if (cachedGrant) {
            return {
                final: {
                    success: cachedGrant.ok === true,
                    stateKnown: true,
                    message: (cachedGrant.msg || "") +
                        " (повтор grantId — изменений нет)",
                    items: state.items
                }
            };
        }

        // 2) вычисление нового инвентаря в памяти
        var resultItems = {};

        for (var itemKey in state.items) {
            if (state.items.hasOwnProperty(itemKey)) {
                resultItems[itemKey] = toInt(state.items[itemKey]);
            }
        }

        var n;

        for (n = 0; n < additions.length; n++) {
            var itemId = additions[n].itemId;

            resultItems[itemId] = toInt(resultItems[itemId]) + additions[n].amount;
        }

        if (Object.keys(resultItems).length > MAX_DISTINCT_ITEMS) {
            return {
                final: {
                    success: false,
                    stateKnown: true,
                    message: "Слишком много разных предметов в инвентаре",
                    items: state.items
                }
            };
        }

        // lastCraftMs (антиспам крафта) не трогаем — выдача не влияет на таймер

        var message = "Выдано предметов: " + added;

        var newState = {
            items: resultItems,
            lastCraftMs: state.lastCraftMs,
            attempts: state.attempts,
            grants: state.grants,
            creations: state.creations,
            chestLastOpenMs: state.chestLastOpenMs,
            chestClaimSequence: state.chestClaimSequence,
            lastSuccessfulAttemptId: state.lastSuccessfulAttemptId,
            lastSuccessfulAttemptResult: state.lastSuccessfulAttemptResult
        };

        // история операции сохраняется ТОЖЕЙ ЖЕ записью, что и новые
        // предметы (атомарно): повтор grantId не выдаст предметы дважды
        rememberGrant(newState, grantId, message);

        var result = {
            success: true,
            stateKnown: true,
            message: message,
            items: resultItems
        };

        if (grantId) {
            result.grantId = grantId;
        }

        return { save: newState, result: result };
    });
};

// ============================================================================
//  Бонусный сундук — бесплатный ресурс каждые 5 минут
// ============================================================================

var CHEST_DEFAULT_COOLDOWN_MINUTES = 60;
var CHEST_MIN_COOLDOWN_MINUTES = 1;
var CHEST_MAX_COOLDOWN_MINUTES = 10080;
var CHEST_MS_PER_MINUTE = 60 * 1000;
var CHEST_CONFIG_KEY = "chest_bonus_config";

// Конфигурация по умолчанию (используется, если Title Data не настроен)
var DEFAULT_CHEST_CONFIG = {
    items: [
        { itemId: "rose_seed", weight: 25 },
        { itemId: "water", weight: 25 },
        { itemId: "flower_pot", weight: 20 },
        { itemId: "gold_ore", weight: 15 },
        { itemId: "ring_casting_mold", weight: 10 },
        { itemId: "ruby", weight: 5 }
    ]
};

function chestGetConfig() {
    var raw = getTitleData(CHEST_CONFIG_KEY);
    if (!raw) return DEFAULT_CHEST_CONFIG;
    try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.items && parsed.items.length > 0) {
            var total = 0;
            for (var i = 0; i < parsed.items.length; i++) {
                total += parsed.items[i].weight || 0;
            }
            if (total > 0) return parsed;
        }
    } catch (e) {}
    return DEFAULT_CHEST_CONFIG;
}

function chestSanitizeCooldownMinutes(value) {
    if (typeof value !== "number" || !isFinite(value) ||
        Math.floor(value) !== value) {
        return 0;
    }

    if (value < CHEST_MIN_COOLDOWN_MINUTES ||
        value > CHEST_MAX_COOLDOWN_MINUTES) {
        return 0;
    }

    return value;
}

// Возвращает cooldown из актуальной конфигурации. Старое поле cooldownMs
// поддерживается только для чтения старых данных.
function chestGetCooldownMs(config) {
    var minutes = chestSanitizeCooldownMinutes(config && config.cooldownMinutes);

    if (minutes) return minutes * CHEST_MS_PER_MINUTE;

    var legacyMs = config && config.cooldownMs;

    if (typeof legacyMs === "number" && isFinite(legacyMs) &&
        Math.floor(legacyMs) === legacyMs &&
        legacyMs >= CHEST_MIN_COOLDOWN_MINUTES * CHEST_MS_PER_MINUTE &&
        legacyMs <= CHEST_MAX_COOLDOWN_MINUTES * CHEST_MS_PER_MINUTE &&
        legacyMs % CHEST_MS_PER_MINUTE === 0) {
        return legacyMs;
    }

    return CHEST_DEFAULT_COOLDOWN_MINUTES * CHEST_MS_PER_MINUTE;
}

function chestSelectRandomItem(config) {
    var totalWeight = 0;
    for (var i = 0; i < config.items.length; i++) {
        totalWeight += config.items[i].weight || 0;
    }
    if (totalWeight <= 0) return null;
    var rand = Math.random() * totalWeight;
    for (var i = 0; i < config.items.length; i++) {
        rand -= config.items[i].weight || 0;
        if (rand <= 0) return config.items[i].itemId;
    }
    return config.items[config.items.length - 1].itemId;
}

handlers.GetChestBonusStatus = function (args, context) {
    var mode = decideStorageMode();
    var current = readState(currentPlayerId, mode);

    if (current.corrupt) {
        return {
            success: false,
            stateKnown: true,
            corrupt: true,
            message: "Данные инвентаря повреждены. Сообщите администраторам."
        };
    }

    if (!current.ok) {
        return {
            success: false,
            stateKnown: false,
            message: "Не удалось прочитать инвентарь",
            readError: snippet(current.error)
        };
    }

    var intervalMs = chestGetCooldownMs(chestGetConfig());
    var lastOpenTime = toInt(current.state.chestLastOpenMs);
    var now = Date.now();
    var remainingMs = Math.max(0, lastOpenTime + intervalMs - now);

    return {
        success: true,
        stateKnown: true,
        lastOpenTime: lastOpenTime,
        intervalMs: intervalMs,
        remainingMs: remainingMs,
        canOpen: remainingMs <= 0,
        chestClaimSequence: toInt(current.state.chestClaimSequence),
        // Момент расчёта remainingMs: клиент привязывает к нему локальный
        // отсчёт, чтобы задержка сети не увеличивала оставшееся время.
        serverNowMs: now
    };
};

handlers.OpenBonusChest = function (args, context) {
    // ---- attemptId обязателен: проверяется до любого изменения инвентаря ----
    var attemptId = trimId(args && args.attemptId ? String(args.attemptId) : "");

    if (!isValidAttemptId(attemptId)) {
        return {
            success: false,
            stateKnown: true,
            attemptIdRequired: true,
            message: "Отсутствует attemptId попытки или он записан " +
                "в неверном формате. Обновите игру."
        };
    }

    // expectedClaimSequence — ожидаемая версия последовательности открытий сундука
    var expectedClaimSequence = args && args.expectedClaimSequence !== undefined
        ? toInt(args.expectedClaimSequence) : -1;

    // Конфигурация читается один раз на вызов. cooldown применяется к
    // последнему открытию: изменение настройки не начинает новый отсчёт.
    var config = chestGetConfig();
    var intervalMs = chestGetCooldownMs(config);

    return runStateUpdate(currentPlayerId, function (state) {
        // Диагностика: логируем входящие и текущие значения
        var currentSequence = toInt(state.chestClaimSequence);
        console.log("[CraftDiag] OpenBonusChest: attemptId=" + attemptId +
            ", expectedClaimSequence=" + expectedClaimSequence +
            ", currentChestClaimSequence=" + currentSequence +
            ", scriptRevision=" + (context && context.revision ? context.revision : "unknown"));

        // 1) Проверка: не является ли запрос повтором последней успешной операции
        if (state.lastSuccessfulAttemptId && state.lastSuccessfulAttemptId === attemptId) {
            var duplicateNowMs = Date.now();
            var duplicateLastOpenMs = toInt(state.chestLastOpenMs);

            return {
                final: {
                    success: true,
                    stateKnown: true,
                    message: "Повтор предыдущей успешной операции",
                    itemId: state.lastSuccessfulAttemptResult.itemId || "",
                    amount: state.lastSuccessfulAttemptResult.amount || 0,
                    remainingMs: Math.max(0,
                        duplicateLastOpenMs + intervalMs - duplicateNowMs),
                    lastOpenTime: duplicateLastOpenMs,
                    intervalMs: intervalMs,
                    serverNowMs: duplicateNowMs,
                    chestClaimSequence: currentSequence
                }
            };
        }

        // 2) Проверка: не устарел ли запрос (expectedClaimSequence не совпадает с текущим)
        if (expectedClaimSequence !== -1 && expectedClaimSequence !== currentSequence) {
            var staleNowMs = Date.now();
            var staleLastOpenMs = toInt(state.chestLastOpenMs);

            return {
                final: {
                    success: false,
                    stateKnown: true,
                    message: "Запрос устарел. Текущая последовательность: " + currentSequence,
                    itemId: "",
                    amount: 0,
                    remainingMs: Math.max(0,
                        staleLastOpenMs + intervalMs - staleNowMs),
                    lastOpenTime: staleLastOpenMs,
                    intervalMs: intervalMs,
                    serverNowMs: staleNowMs,
                    chestClaimSequence: currentSequence
                }
            };
        }

        // 3) Атомарная проверка cooldown ВНУТРИ compute()
        var now = Date.now();
        var currentChestLastOpenMs = toInt(state.chestLastOpenMs);
        var remainingMs = Math.max(0, currentChestLastOpenMs + intervalMs - now);

        // Диагностика состояния хранения
        console.log("[CraftDiag] OpenBonusChest: attemptId=" + attemptId +
            ", expectedClaimSequence=" + expectedClaimSequence +
            ", currentChestClaimSequence=" + currentSequence +
            ", chestLastOpenMs=" + currentChestLastOpenMs +
            ", now=" + now +
            ", remainingMs=" + remainingMs +
            ", scriptRevision=" + (context && context.revision ? context.revision : "unknown"));

        if (remainingMs > 0) {
            // Сохраняем отказ для этого attemptId, чтобы повтор не начислял предмет
            rememberAttempt(state, attemptId, "bonus_chest", false,
                "Сундук будет доступен через " + Math.ceil(remainingMs / 60000) + " мин.",
                "", 0);

            return {
                save: {
                    items: state.items,
                    lastCraftMs: state.lastCraftMs,
                    attempts: state.attempts,
                    grants: state.grants,
                    creations: state.creations,
                    chestLastOpenMs: currentChestLastOpenMs,
                    chestClaimSequence: currentSequence,
                    lastSuccessfulAttemptId: state.lastSuccessfulAttemptId,
                    lastSuccessfulAttemptResult: state.lastSuccessfulAttemptResult
                },
                result: {
                    success: false,
                    stateKnown: true,
                    itemId: "",
                    amount: 0,
                    remainingMs: remainingMs,
                    lastOpenTime: currentChestLastOpenMs,
                    intervalMs: intervalMs,
                    serverNowMs: now,
                    message: "Сундук будет доступен через " + Math.ceil(remainingMs / 60000) + " мин.",
                    chestClaimSequence: currentSequence
                }
            };
        }

        // 4) Выбрать награду и начислить
        var itemId = chestSelectRandomItem(config);
        if (!itemId) {
            return {
                final: {
                    success: false,
                    stateKnown: true,
                    message: "Нет настроенных наград."
                }
            };
        }

        var amount = 1;

        var resultItems = {};
        for (var key in state.items) {
            if (state.items.hasOwnProperty(key)) {
                resultItems[key] = toInt(state.items[key]);
            }
        }
        resultItems[itemId] = toInt(resultItems[itemId]) + amount;

        var newState = {
            items: resultItems,
            lastCraftMs: state.lastCraftMs,
            attempts: state.attempts,
            grants: state.grants,
            creations: state.creations,
            chestLastOpenMs: now,
            chestClaimSequence: currentSequence + 1,
            lastSuccessfulAttemptId: attemptId,
            lastSuccessfulAttemptResult: {
                itemId: itemId,
                amount: amount,
                remainingMs: 0
            }
        };

        rememberAttempt(newState, attemptId, "bonus_chest", true,
            "Сундук открыт: " + itemId, itemId, amount);

        console.log("[CraftDiag] OpenBonusChest: newState.chestLastOpenMs=" + newState.chestLastOpenMs +
            ", now=" + now);

        var openedNowMs = Date.now();
        var openedRemainingMs = Math.max(0,
            toInt(newState.chestLastOpenMs) + intervalMs - openedNowMs);

        return {
            save: newState,
            result: {
                success: true,
                stateKnown: true,
                itemId: itemId,
                amount: amount,
                remainingMs: openedRemainingMs,
                lastOpenTime: newState.chestLastOpenMs,
                intervalMs: intervalMs,
                serverNowMs: openedNowMs,
                message: "Сундук открыт: " + itemId,
                chestClaimSequence: newState.chestClaimSequence
            }
        };
    });
};

// ============================================================================
//  SOURCE: BonusChestCloudScript.js — Бонусный сундук
//  sha256: c20dce7bcecd0b3fa2f54ec370c21788d905b8d4a31881ea87ca66656abaeda2
// ============================================================================


var BONUS_CHEST_DEFAULT_COOLDOWN_MINUTES = 60;
var BONUS_CHEST_MIN_COOLDOWN_MINUTES = 1;
var BONUS_CHEST_MAX_COOLDOWN_MINUTES = 10080; // 7 суток
var BONUS_CHEST_MS_PER_MINUTE = 60 * 1000;
var BONUS_CHEST_CONFIG_KEY = "chest_bonus_config";
var BONUS_CHEST_ATTEMPT_MARKER = "bonus_chest";
var BONUS_CHEST_MAX_TOTAL_WEIGHT = 1000000;
var BONUS_CHEST_MAX_ITEM_WEIGHT = 100000; // максимум веса одного предмета (ТЗ)
var BONUS_CHEST_DEFAULT_ITEMS = [
    { itemId: "rose_seed", weight: 25 },
    { itemId: "water", weight: 25 },
    { itemId: "flower_pot", weight: 20 },
    { itemId: "gold_ore", weight: 15 },
    { itemId: "ring_casting_mold", weight: 10 },
    { itemId: "ruby", weight: 5 }
];

// Кэш на один запуск CloudScript: каждый вызов handler-а PlayFab выполняет
// скрипт в новом контексте, поэтому чтение Title Data внутри одного вызова
// происходит один раз. Запись через SetDropConfig сбрасывает кэш.
var BONUS_CHEST_CONFIG_CACHE = null;

function bonusChestLog(message) {
    if (typeof console !== "undefined" && console &&
        typeof console.log === "function") {
        console.log(message);
    }
}


function bonusChestDiag(phase, data) {
    var parts = [ "[BonusChest]", phase ];

    if (data) {
        for (var key in data) {
            if (!data.hasOwnProperty(key)) continue;
            parts.push(key + "=" + String(data[key]));
        }
    }

    bonusChestLog(parts.join(" "));
}

function bonusChestRevision(context) {
    if (context && context.revision !== undefined && context.revision !== null) {
        return String(context.revision);
    }

    return "unknown";
}

function bonusChestDefaultItems() {
    var defaults = [];

    for (var d = 0; d < BONUS_CHEST_DEFAULT_ITEMS.length; d++) {
        defaults.push({
            itemId: BONUS_CHEST_DEFAULT_ITEMS[d].itemId,
            weight: BONUS_CHEST_DEFAULT_ITEMS[d].weight
        });
    }

    return defaults;
}

function bonusChestIsPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function bonusChestIsKnownItemId(itemId) {
    for (var i = 0; i < BONUS_CHEST_DEFAULT_ITEMS.length; i++) {
        if (BONUS_CHEST_DEFAULT_ITEMS[i].itemId === itemId) return true;
    }

    return false;
}

function bonusChestSumWeights(items) {
    var total = 0;

    for (var i = 0; i < items.length; i++) {
        total += items[i].weight;
    }

    return total;
}

// Строгая проверка весов. Возвращает нормализованный список в порядке
// BONUS_CHEST_DEFAULT_ITEMS либо подробную ошибку. Частично корректные
// наборы НЕ принимаются: нужны все шесть предметов, без дублей.
function bonusChestValidateItems(rawItems) {
    var result = {
        ok: false,
        error: "",
        items: [],
        totalWeight: 0
    };

    if (!Array.isArray(rawItems)) {
        result.error = "поле items отсутствует или не является массивом";
        return result;
    }

    if (rawItems.length !== BONUS_CHEST_DEFAULT_ITEMS.length) {
        result.error = "ожидалось " + BONUS_CHEST_DEFAULT_ITEMS.length +
            " предметов, получено " + rawItems.length;
        return result;
    }

    var weightsById = {};

    for (var i = 0; i < rawItems.length; i++) {
        var entry = rawItems[i];

        if (!bonusChestIsPlainObject(entry)) {
            result.error = "элемент " + i +
                ": ожидался объект { itemId, weight }";
            return result;
        }

        var itemId = trimId(entry.itemId);

        if (!isValidItemId(itemId)) {
            result.error = "элемент " + i + ": некорректный itemId";
            return result;
        }

        if (!bonusChestIsKnownItemId(itemId)) {
            result.error = "элемент " + i +
                ": неизвестный itemId \"" + itemId + "\"";
            return result;
        }

        if (weightsById.hasOwnProperty(itemId)) {
            result.error = "itemId \"" + itemId + "\" указан несколько раз";
            return result;
        }

        var weight = entry.weight;

        // Строки, NaN, Infinity, дробные и прочие типы запрещены.
        if (typeof weight !== "number" || !isFinite(weight) ||
            Math.floor(weight) !== weight) {
            result.error = "itemId \"" + itemId +
                "\": вес должен быть целым числом";
            return result;
        }

        if (weight < 0 || weight > BONUS_CHEST_MAX_ITEM_WEIGHT) {
            result.error = "itemId \"" + itemId + "\": вес " + weight +
                " вне диапазона 0.." + BONUS_CHEST_MAX_ITEM_WEIGHT;
            return result;
        }

        weightsById[itemId] = weight;
    }

    var items = [];

    for (var d = 0; d < BONUS_CHEST_DEFAULT_ITEMS.length; d++) {
        var defaultItemId = BONUS_CHEST_DEFAULT_ITEMS[d].itemId;

        if (!weightsById.hasOwnProperty(defaultItemId)) {
            result.error = "отсутствует itemId \"" + defaultItemId + "\"";
            return result;
        }

        items.push({
            itemId: defaultItemId,
            weight: weightsById[defaultItemId]
        });
    }

    var totalWeight = bonusChestSumWeights(items);

    if (totalWeight <= 0) {
        result.error = "сумма весов должна быть больше нуля";
        return result;
    }

    if (totalWeight > BONUS_CHEST_MAX_TOTAL_WEIGHT) {
        result.error = "сумма весов " + totalWeight +
            " больше предела " + BONUS_CHEST_MAX_TOTAL_WEIGHT;
        return result;
    }

    result.ok = true;
    result.items = items;
    result.totalWeight = totalWeight;

    return result;
}

function bonusChestSanitizeCooldownMinutes(value) {
    if (typeof value !== "number" || !isFinite(value) ||
        Math.floor(value) !== value) {
        return 0;
    }

    if (value < BONUS_CHEST_MIN_COOLDOWN_MINUTES ||
        value > BONUS_CHEST_MAX_COOLDOWN_MINUTES) {
        return 0;
    }

    return value;
}

// Старые конфигурации могли хранить cooldownMs. Поддерживаем их только как
// источник миграции: новое значение всегда хранится в cooldownMinutes.
function bonusChestLegacyCooldownMinutes(value) {
    if (typeof value !== "number" || !isFinite(value) ||
        Math.floor(value) !== value) {
        return 0;
    }

    var minMs = BONUS_CHEST_MIN_COOLDOWN_MINUTES *
        BONUS_CHEST_MS_PER_MINUTE;
    var maxMs = BONUS_CHEST_MAX_COOLDOWN_MINUTES *
        BONUS_CHEST_MS_PER_MINUTE;

    if (value < minMs || value > maxMs ||
        value % BONUS_CHEST_MS_PER_MINUTE !== 0) {
        return 0;
    }

    return value / BONUS_CHEST_MS_PER_MINUTE;
}

// Читает chest_bonus_config. При отсутствии конфигурации возвращает значения
// по умолчанию. Повреждённая/невалидная конфигурация НЕ используется
// частично: GetDropConfig показывает безопасные значения для ремонта, а
// GetChestBonusStatus/OpenBonusChest безопасно отказывают (valid=false), чтобы
// не выдать награду по ошибочному нулевому cooldown.
function bonusChestReadConfig() {
    if (BONUS_CHEST_CONFIG_CACHE) return BONUS_CHEST_CONFIG_CACHE;

    var defaults = bonusChestDefaultItems();

    var fallback = {
        items: defaults,
        totalWeight: bonusChestSumWeights(defaults),
        cooldownMinutes: BONUS_CHEST_DEFAULT_COOLDOWN_MINUTES,
        cooldownMs: BONUS_CHEST_DEFAULT_COOLDOWN_MINUTES *
            BONUS_CHEST_MS_PER_MINUTE,
        source: "defaults",
        configPresent: false,
        valid: true,
        error: ""
    };

    var raw = "";

    try {
        raw = getTitleData(BONUS_CHEST_CONFIG_KEY);
    } catch (e) {
        fallback.valid = false;
        fallback.error = "не удалось прочитать Title Data: " + errText(e);

        bonusChestDiag("DropConfig: ошибка чтения Title Data", {
            key: BONUS_CHEST_CONFIG_KEY,
            error: snippet(errText(e))
        });

        BONUS_CHEST_CONFIG_CACHE = fallback;
        return fallback;
    }

    if (!raw) {
        BONUS_CHEST_CONFIG_CACHE = fallback;
        return fallback;
    }

    fallback.configPresent = true;

    var parsed;

    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        fallback.valid = false;
        fallback.error = "JSON не разобран: " + errText(e);

        bonusChestDiag("DropConfig: повреждённый JSON, значения по умолчанию", {
            key: BONUS_CHEST_CONFIG_KEY,
            error: snippet(errText(e)),
            rawLength: raw.length
        });

        BONUS_CHEST_CONFIG_CACHE = fallback;
        return fallback;
    }

    if (!bonusChestIsPlainObject(parsed)) {
        fallback.valid = false;
        fallback.error = "корневой элемент конфигурации не является объектом";

        bonusChestDiag("DropConfig: некорневой объект, значения по умолчанию", {
            key: BONUS_CHEST_CONFIG_KEY
        });

        BONUS_CHEST_CONFIG_CACHE = fallback;
        return fallback;
    }

    var validation = bonusChestValidateItems(parsed.items);

    if (!validation.ok) {
        fallback.valid = false;
        fallback.error = "некорректные веса: " + validation.error;

        bonusChestDiag("DropConfig: невалидные веса, значения по умолчанию", {
            key: BONUS_CHEST_CONFIG_KEY,
            error: validation.error,
            itemsSeen: Array.isArray(parsed.items) ? parsed.items.length : -1
        });

        BONUS_CHEST_CONFIG_CACHE = fallback;
        return fallback;
    }

    var hasCooldownMinutes = parsed.cooldownMinutes !== undefined &&
        parsed.cooldownMinutes !== null;
    var cooldownMinutes = 0;

    if (hasCooldownMinutes) {
        cooldownMinutes =
            bonusChestSanitizeCooldownMinutes(parsed.cooldownMinutes);

        if (!cooldownMinutes) {
            fallback.valid = false;
            fallback.error = "некорректные cooldownMinutes: " +
                String(parsed.cooldownMinutes) +
                " (нужно целое число 1…10080)";

            bonusChestDiag("DropConfig: некорректные cooldownMinutes", {
                key: BONUS_CHEST_CONFIG_KEY,
                value: String(parsed.cooldownMinutes),
                min: BONUS_CHEST_MIN_COOLDOWN_MINUTES,
                max: BONUS_CHEST_MAX_COOLDOWN_MINUTES
            });

            BONUS_CHEST_CONFIG_CACHE = fallback;
            return fallback;
        }
    } else {
        // Совместимость со старым полем cooldownMs. Если его нет, по ТЗ
        // используется 60 минут; значение никогда не превращается в 0.
        cooldownMinutes = bonusChestLegacyCooldownMinutes(parsed.cooldownMs);

        if (!cooldownMinutes) {
            cooldownMinutes = BONUS_CHEST_DEFAULT_COOLDOWN_MINUTES;

            if (parsed.cooldownMs !== undefined) {
                bonusChestDiag("DropConfig: старый cooldownMs некорректен, " +
                    "используются 60 минут", {
                    key: BONUS_CHEST_CONFIG_KEY,
                    value: String(parsed.cooldownMs)
                });
            }
        }
    }

    var config = {
        items: validation.items,
        totalWeight: validation.totalWeight,
        cooldownMinutes: cooldownMinutes,
        cooldownMs: cooldownMinutes * BONUS_CHEST_MS_PER_MINUTE,
        source: "titleData",
        configPresent: true,
        valid: true,
        error: ""
    };

    BONUS_CHEST_CONFIG_CACHE = config;
    return config;
}

function bonusChestLoadItems() {
    return bonusChestReadConfig().items;
}

function bonusChestCooldownMs() {
    return bonusChestReadConfig().cooldownMs;
}

function bonusChestPercent(weight, totalWeight) {
    if (totalWeight <= 0) return 0;

    return Math.round((weight / totalWeight) * 10000) / 100;
}

function bonusChestDropConfigPayload(config, admin) {
    var items = [];
    var availableItemIds = [];

    for (var i = 0; i < config.items.length; i++) {
        var item = config.items[i];

        items.push({
            itemId: item.itemId,
            weight: item.weight,
            percent: bonusChestPercent(item.weight, config.totalWeight)
        });

        availableItemIds.push(item.itemId);
    }

    return {
        success: true,
        saved: false,
        configSource: config.source,
        configValid: config.valid,
        configPresent: config.configPresent,
        cooldownMinutes: config.cooldownMinutes,
        cooldownMs: config.cooldownMs,
        totalWeight: config.totalWeight,
        items: items,
        availableItemIds: availableItemIds,
        isAdmin: !!admin,
        warning: config.error || ""
    };
}

function bonusChestPickWeighted(items) {
    if (!items || !items.length) return "";

    var totalWeight = 0;
    var i;

    for (i = 0; i < items.length; i++) {
        totalWeight += items[i].weight;
    }

    if (totalWeight <= 0) return "";

    var roll = Math.floor(Math.random() * totalWeight);
    var cumulative = 0;

    for (i = 0; i < items.length; i++) {
        cumulative += items[i].weight;

        if (roll < cumulative) return items[i].itemId;
    }

    return items[items.length - 1].itemId;
}

function bonusChestCloneState(state) {
    return JSON.parse(JSON.stringify(state));
}
function bonusChestFindSuccess(state, attemptId) {
    if (!attemptId) return null;

    if (state.lastSuccessfulAttemptId === attemptId &&
        state.lastSuccessfulAttemptResult &&
        typeof state.lastSuccessfulAttemptResult === "object") {
        return {
            itemId: trimId(state.lastSuccessfulAttemptResult.itemId),
            amount: toInt(state.lastSuccessfulAttemptResult.amount)
        };
    }

    // Более старые успешные открытия (история attempts ограничена ядром).
    if (!(state.attempts instanceof Array)) return null;

    for (var i = state.attempts.length - 1; i >= 0; i--) {
        var attempt = state.attempts[i];

        if (attempt && attempt.id === attemptId &&
            attempt.recipe === BONUS_CHEST_ATTEMPT_MARKER &&
            attempt.ok === true) {
            return {
                itemId: trimId(attempt.itemId),
                amount: toInt(attempt.amount)
            };
        }
    }

    return null;
}

function bonusChestRemainingMs(lastOpenMs, cooldownMs) {
    var intervalMs = toInt(cooldownMs);

    if (intervalMs <= 0) intervalMs = bonusChestCooldownMs();

    return Math.max(0, toInt(lastOpenMs) + intervalMs - Date.now());
}

function bonusChestGetStatus(args, context) {
    var playFabId = currentPlayerId;
    var revision = bonusChestRevision(context);
    var mode = decideStorageMode();
    var config = bonusChestReadConfig();

    // Повреждённая конфигурация не должна превращаться в нулевой cooldown.
    // Клиент сохранит последнее подтверждённое состояние и не активирует
    // кнопку открытия.
    if (!config.valid) {
        bonusChestDiag("GetChestBonusStatus: конфигурация повреждена", {
            handler: "GetChestBonusStatus",
            playFabId: playFabId,
            storageMode: mode,
            scriptRevision: revision,
            configError: config.error
        });

        return {
            success: false,
            stateKnown: true,
            configError: true,
            configValid: false,
            source: mode,
            message: "Конфигурация бонусного сундука повреждена. " +
                "Открытие временно недоступно, сообщите администраторам."
        };
    }

    var cooldownMs = config.cooldownMs;
    var current = readState(playFabId, mode);

    bonusChestDiag("GetChestBonusStatus", {
        handler: "GetChestBonusStatus",
        playFabId: playFabId,
        storageMode: mode,
        scriptRevision: revision,
        readOk: !!(current && current.ok),
        corrupt: !!(current && current.corrupt),
        cooldownMinutes: config.cooldownMinutes,
        intervalMs: cooldownMs
    });

    if (current && current.corrupt) {
        return {
            success: false,
            stateKnown: true,
            corrupt: true,
            source: mode,
            message: "Данные инвентаря повреждены. Сообщите администраторам."
        };
    }

    if (!current || !current.ok) {
        bonusChestDiag("GetChestBonusStatus: чтение не удалось", {
            playFabId: playFabId,
            storageMode: mode,
            readError: snippet(current && current.error)
        });

        return {
            success: false,
            stateKnown: false,
            source: mode,
            message: "Не удалось прочитать инвентарь",
            readError: snippet(current && current.error)
        };
    }

    var lastOpenTime = toInt(current.state.chestLastOpenMs);
    var sequence = toInt(current.state.chestClaimSequence);
    var now = Date.now();
    var remainingMs = Math.max(0,
        lastOpenTime + cooldownMs - now);
    // Признак несогласованного состояния: открытия были, а время последнего
    // открытия отсутствует. Это ровно тот случай, когда статус ошибочно
    // выглядел «готовым». Само значение canOpen не подменяем (иначе такие
    // игроки навсегда потеряют доступ к сундуку), но помечаем для диагностики
    // и для клиента.
    var inconsistent = sequence > 0 && lastOpenTime <= 0;
    var canOpen = remainingMs <= 0;

    bonusChestDiag("GetChestBonusStatus", {
        handler: "GetChestBonusStatus",
        playFabId: playFabId,
        storageMode: mode,
        scriptRevision: revision,
        chestLastOpenMs: lastOpenTime,
        now: now,
        timeUtc: new Date(now).toISOString(),
        intervalMs: cooldownMs,
        remainingMs: remainingMs,
        canOpen: canOpen,
        chestClaimSequence: sequence,
        stateVersion: toInt(current.version),
        inconsistent: inconsistent
    });

    return {
        success: true,
        stateKnown: true,
        canOpen: canOpen,
        remainingMs: remainingMs,
        lastOpenTime: lastOpenTime,
        intervalMs: cooldownMs,
        chestClaimSequence: sequence,
        stateVersion: toInt(current.version),
        inconsistent: inconsistent,
        // Момент, на котором сервер посчитал remainingMs. Клиент использует его,
        // чтобы привязать локальный отсчёт к серверному времени, а не к моменту
        // получения ответа: задержка сети не должна «добавлять» секунды.
        serverNowMs: now,
        source: mode
    };
}

function bonusChestOpen(args, context) {
    var playFabId = currentPlayerId;
    var revision = bonusChestRevision(context);
    var mode = decideStorageMode();

    var attemptId = trimId(args && args.attemptId ? String(args.attemptId) : "");

    if (!isValidAttemptId(attemptId)) {
        bonusChestDiag("OpenBonusChest: некорректный attemptId", {
            handler: "OpenBonusChest",
            playFabId: playFabId,
            storageMode: mode,
            scriptRevision: revision
        });

        return {
            success: false,
            stateKnown: true,
            attemptIdRequired: true,
            itemId: "",
            amount: 0,
            remainingMs: 0,
            chestClaimSequence: 0,
            message: "Отсутствует attemptId попытки или он записан " +
                "в неверном формате. Обновите игру."
        };
    }

    var hasExpected = args &&
        args.expectedClaimSequence !== undefined &&
        args.expectedClaimSequence !== null &&
        String(args.expectedClaimSequence) !== "";

    var expectedClaimSequence = hasExpected
        ? toInt(args.expectedClaimSequence)
        : -1;

    // Актуальные настройки читаются один раз на вызов: и веса, и cooldown
    // берутся из одного и того же снимка chest_bonus_config.
    var config = bonusChestReadConfig();

    if (!config.valid) {
        bonusChestDiag("OpenBonusChest: конфигурация повреждена", {
            handler: "OpenBonusChest",
            playFabId: playFabId,
            storageMode: mode,
            scriptRevision: revision,
            attemptId: attemptId,
            configError: config.error
        });

        return {
            success: false,
            stateKnown: true,
            configError: true,
            configValid: false,
            itemId: "",
            amount: 0,
            remainingMs: 0,
            chestClaimSequence: 0,
            source: mode,
            message: "Конфигурация бонусного сундука повреждена. " +
                "Награда не выдана, сообщите администраторам."
        };
    }

    var cooldownMs = config.cooldownMs;
    var rewardItems = config.items;

    var result = runStateUpdate(playFabId, function (state) {
        var currentSequence = toInt(state.chestClaimSequence);
        var oldLastOpenMs = toInt(state.chestLastOpenMs);
        var remainingMs = bonusChestRemainingMs(oldLastOpenMs, cooldownMs);
        var now = Date.now();

        bonusChestDiag("OpenBonusChest: состояние до проверок", {
            handler: "OpenBonusChest",
            playFabId: playFabId,
            storageMode: mode,
            scriptRevision: revision,
            attemptId: attemptId,
            expectedClaimSequence: expectedClaimSequence,
            chestClaimSequence: currentSequence,
            oldChestLastOpenMs: oldLastOpenMs,
            now: now,
            remainingMs: remainingMs
        });

        // ---- 1) идемпотентность: повтор уже выданной награды ----
        var cached = bonusChestFindSuccess(state, attemptId);

        if (cached) {
            bonusChestDiag("OpenBonusChest: повтор attemptId", {
                attemptId: attemptId,
                itemId: cached.itemId,
                amount: cached.amount,
                chestClaimSequence: currentSequence
            });

            return {
                final: {
                    success: true,
                    stateKnown: true,
                    duplicate: true,
                    itemId: cached.itemId,
                    amount: cached.amount,
                    remainingMs: remainingMs,
                    lastOpenTime: oldLastOpenMs,
                    intervalMs: cooldownMs,
                    chestClaimSequence: currentSequence,
                    source: mode,
                    message: "Повтор запроса: награда уже выдана (" +
                        cached.itemId + " ×" + cached.amount + ")"
                }
            };
        }

        if (expectedClaimSequence >= 0 &&
            expectedClaimSequence !== currentSequence) {
            bonusChestDiag("OpenBonusChest: устаревший запрос", {
                attemptId: attemptId,
                expectedClaimSequence: expectedClaimSequence,
                chestClaimSequence: currentSequence
            });

            return {
                final: {
                    success: false,
                    stateKnown: true,
                    stale: true,
                    itemId: "",
                    amount: 0,
                    remainingMs: remainingMs,
                    lastOpenTime: oldLastOpenMs,
                    intervalMs: cooldownMs,
                    chestClaimSequence: currentSequence,
                    source: mode,
                    message: "Запрос устарел: последовательность изменена " +
                        "(ожидалось " + expectedClaimSequence +
                        ", сейчас " + currentSequence + ")"
                }
            };
        }

        if (remainingMs > 0) {
            bonusChestDiag("OpenBonusChest: cooldown активен", {
                attemptId: attemptId,
                remainingMs: remainingMs,
                chestLastOpenMs: oldLastOpenMs
            });

            return {
                final: {
                    success: false,
                    stateKnown: true,
                    cooldown: true,
                    itemId: "",
                    amount: 0,
                    remainingMs: remainingMs,
                    lastOpenTime: oldLastOpenMs,
                    intervalMs: cooldownMs,
                    chestClaimSequence: currentSequence,
                    serverNowMs: now,
                    source: mode,
                    message: "Сундук будет доступен через " +
                        Math.ceil(remainingMs / 60000) + " мин."
                }
            };
        }

        // ---- 4) награда ----
        var items = rewardItems;
        var itemId = bonusChestPickWeighted(items);

        if (!itemId) {
            return {
                final: {
                    success: false,
                    stateKnown: true,
                    itemId: "",
                    amount: 0,
                    remainingMs: remainingMs,
                    lastOpenTime: oldLastOpenMs,
                    intervalMs: cooldownMs,
                    chestClaimSequence: currentSequence,
                    source: mode,
                    message: "Нет настроенных наград для сундука."
                }
            };
        }

        var amount = 1;
        var newState = bonusChestCloneState(state);

        if (!newState.items || typeof newState.items !== "object" ||
            newState.items instanceof Array) {
            newState.items = {};
        }

        // Страховка: копия обязана содержать все поля исходного состояния.
        for (var field in state) {
            if (!state.hasOwnProperty(field)) continue;

            if (!newState.hasOwnProperty(field)) {
                bonusChestDiag("OpenBonusChest: потеряно поле состояния", {
                    field: field,
                    attemptId: attemptId
                });

                return {
                    final: {
                        success: false,
                        stateKnown: true,
                        itemId: "",
                        amount: 0,
                        remainingMs: remainingMs,
                        lastOpenTime: oldLastOpenMs,
                        intervalMs: cooldownMs,
                        chestClaimSequence: currentSequence,
                        source: mode,
                        message: "Внутренняя ошибка: состояние не скопировано."
                    }
                };
            }
        }

        newState.items[itemId] = toInt(newState.items[itemId]) + amount;
        newState.chestLastOpenMs = now;
        newState.chestClaimSequence = currentSequence + 1;
        newState.lastSuccessfulAttemptId = attemptId;
        newState.lastSuccessfulAttemptResult = {
            itemId: itemId,
            amount: amount,
            atMs: now,
            chestClaimSequence: newState.chestClaimSequence
        };

        var message = "Сундук открыт: " + itemId + " ×" + amount;

        rememberAttempt(newState, attemptId, BONUS_CHEST_ATTEMPT_MARKER,
            true, message, itemId, amount);

        bonusChestDiag("OpenBonusChest: состояние к сохранению", {
            handler: "OpenBonusChest",
            playFabId: playFabId,
            storageMode: mode,
            scriptRevision: revision,
            attemptId: attemptId,
            itemId: itemId,
            amount: amount,
            oldChestLastOpenMs: oldLastOpenMs,
            newChestLastOpenMs: newState.chestLastOpenMs,
            oldSequence: currentSequence,
            newSequence: newState.chestClaimSequence
        });

        var resultNowMs = Date.now();
        var resultRemainingMs = Math.max(0,
            toInt(newState.chestLastOpenMs) + cooldownMs - resultNowMs);

        return {
            save: newState,
            result: {
                success: true,
                stateKnown: true,
                itemId: itemId,
                amount: amount,
                remainingMs: resultRemainingMs,
                lastOpenTime: newState.chestLastOpenMs,
                intervalMs: cooldownMs,
                chestClaimSequence: newState.chestClaimSequence,
                // Момент расчёта remainingMs — клиент привязывает к нему
                // локальный отсчёт, чтобы задержка сети не увеличивала время.
                serverNowMs: resultNowMs,
                source: mode,
                message: message
            }
        };
    });

    // Ответ всегда имеет одинаковый набор полей: клиент (ChestResult) не должен
    // получать undefined даже на путях повреждённых данных/ошибок чтения-записи.
    if (result && typeof result === "object") {
        if (result.itemId === undefined) result.itemId = "";
        if (result.amount === undefined) result.amount = 0;
        if (result.remainingMs === undefined) result.remainingMs = 0;
        if (result.source === undefined) result.source = mode;
    }

    // ---- диагностика результата сохранения ----
    bonusChestDiag("OpenBonusChest: результат", {
        handler: "OpenBonusChest",
        playFabId: playFabId,
        storageMode: mode,
        scriptRevision: revision,
        attemptId: attemptId,
        expectedClaimSequence: expectedClaimSequence,
        success: !!(result && result.success),
        itemId: (result && result.itemId) || "",
        amount: (result && result.amount) || 0,
        remainingMs: (result && result.remainingMs) || 0,
        lastOpenTime: (result && result.lastOpenTime) || 0,
        chestClaimSequence: (result && result.chestClaimSequence) || 0,
        stateKnown: result ? result.stateKnown : false,
        corrupt: !!(result && result.corrupt),
        stale: !!(result && result.stale),
        cooldown: !!(result && result.cooldown),
        duplicate: !!(result && result.duplicate),
        readError: (result && result.readError) || "",
        saveError: (result && result.saveError) || "",
        message: (result && result.message) || ""
    });

    // ---- контрольное ПЕРЕЧИТЫВАНИЕ после подтверждённого сохранения ----
    // Только чтение: ничего не пишем. Нужно, чтобы лог подтверждал фактическое
    // значение chestLastOpenMs в хранилище, а не только вычисленное в памяти.
    // Результат перечитывания отдаётся клиенту полем stateVerified, чтобы
    // в логах клиента было видно: cooldown реально записан.
    if (result && result.success === true && result.duplicate !== true) {
        var verifyMode = decideStorageMode();
        var verify = readState(playFabId, verifyMode);
        result.stateVerified = false;

        if (verify && verify.ok && !verify.corrupt) {
            var storedLastOpenMs = toInt(verify.state.chestLastOpenMs);
            var storedSequence = toInt(verify.state.chestClaimSequence);
            var expectedLastOpenMs = toInt(result.lastOpenTime);
            var matches = storedLastOpenMs === expectedLastOpenMs &&
                storedSequence === toInt(result.chestClaimSequence);

            result.stateVerified = matches;

            bonusChestDiag("OpenBonusChest: перечитывание после записи", {
                playFabId: playFabId,
                storageMode: verify.mode || verifyMode,
                scriptRevision: revision,
                attemptId: attemptId,
                storedChestLastOpenMs: storedLastOpenMs,
                storedChestClaimSequence: storedSequence,
                expectedChestLastOpenMs: expectedLastOpenMs,
                expectedChestClaimSequence: toInt(result.chestClaimSequence),
                stateVersion: toInt(verify.version),
                matches: matches
            });

            if (!matches) {
                bonusChestDiag("OpenBonusChest: ВНИМАНИЕ, cooldown не подтверждён перечитыванием", {
                    attemptId: attemptId,
                    storedChestLastOpenMs: storedLastOpenMs,
                    expectedChestLastOpenMs: expectedLastOpenMs
                });
            }
        } else {
            bonusChestDiag("OpenBonusChest: перечитывание не удалось", {
                playFabId: playFabId,
                storageMode: verifyMode,
                scriptRevision: revision,
                corrupt: !!(verify && verify.corrupt),
                readError: snippet(verify && verify.error)
            });
        }
    }

    return result;
}

// ----------------------------------------------------------------------------
//  Настройки шансов выпадения (админка)
// ----------------------------------------------------------------------------

// Get: доступен любому игроку (данные не секретные). isAdmin вычисляется
// на сервере и служит только для отображения, права на запись он не даёт.
function bonusChestGetDropConfig(args, context) {
    var playFabId = currentPlayerId;
    var revision = bonusChestRevision(context);
    var config = bonusChestReadConfig();
    var admin = false;

    try {
        admin = isAdmin(playFabId);
    } catch (e) {
        bonusChestDiag("GetDropConfig: ошибка проверки прав", {
            playFabId: playFabId,
            error: snippet(errText(e))
        });
    }

    var payload = bonusChestDropConfigPayload(config, admin);

    payload.message = config.valid
        ? "Настройки шансов загружены"
        : "Конфигурация повреждена: " + config.error +
            ". Показаны значения по умолчанию.";

    bonusChestDiag("GetDropConfig", {
        handler: "BonusChest_GetDropConfig",
        playFabId: playFabId,
        scriptRevision: revision,
        isAdmin: admin,
        configSource: config.source,
        configPresent: config.configPresent,
        configValid: config.valid,
        totalWeight: config.totalWeight,
        cooldownMinutes: config.cooldownMinutes,
        cooldownMs: config.cooldownMs,
        error: config.error
    });

    return payload;
}

// Set: только администратор из Title Data craft_admin_playfabids.
// Клиентский флаг isAdmin/скрытая кнопка НЕ учитываются.
function bonusChestSetDropConfig(args, context) {
    var playFabId = currentPlayerId;
    var revision = bonusChestRevision(context);
    var admin = false;

    try {
        admin = isAdmin(playFabId);
    } catch (e) {
        bonusChestDiag("SetDropConfig: ошибка проверки прав", {
            playFabId: playFabId,
            scriptRevision: revision,
            error: snippet(errText(e))
        });

        return {
            success: false,
            saved: false,
            forbidden: true,
            message: "Не удалось проверить права администратора. " +
                "Настройки не изменены."
        };
    }

    if (!admin) {
        bonusChestDiag("SetDropConfig: доступ запрещён", {
            playFabId: playFabId,
            scriptRevision: revision
        });

        return {
            success: false,
            saved: false,
            forbidden: true,
            message: "Недостаточно прав: изменение шансов доступно " +
                "только администраторам."
        };
    }

    var requested = args && args.weights !== undefined
        ? args.weights
        : (args && args.items);

    var validation = bonusChestValidateItems(requested);

    if (!validation.ok) {
        bonusChestDiag("SetDropConfig: веса отклонены", {
            playFabId: playFabId,
            scriptRevision: revision,
            error: validation.error
        });

        return {
            success: false,
            saved: false,
            validation: true,
            error: validation.error,
            message: "Некорректные веса: " + validation.error
        };
    }

    var hasCooldownArg = !!(args &&
        args.cooldownMinutes !== undefined);
    var requestedCooldownMinutes = 0;

    if (hasCooldownArg) {
        requestedCooldownMinutes =
            bonusChestSanitizeCooldownMinutes(args.cooldownMinutes);

        if (!requestedCooldownMinutes) {
            var cooldownError = "cooldownMinutes должен быть целым " +
                "числом от " + BONUS_CHEST_MIN_COOLDOWN_MINUTES +
                " до " + BONUS_CHEST_MAX_COOLDOWN_MINUTES;

            bonusChestDiag("SetDropConfig: cooldownMinutes отклонён", {
                playFabId: playFabId,
                scriptRevision: revision,
                value: String(args.cooldownMinutes),
                error: cooldownError
            });

            return {
                success: false,
                saved: false,
                validation: true,
                error: cooldownError,
                message: "Некорректное время: " + cooldownError + "."
            };
        }
    }

    // Текущую конфигурацию читаем, чтобы не потерять cooldown и любые
    // дополнительные поля. Если прочитать не удалось — не пишем вовсе,
    // иначе можно случайно сбросить cooldown.
    var raw = "";

    try {
        raw = getTitleData(BONUS_CHEST_CONFIG_KEY);
    } catch (e) {
        bonusChestDiag("SetDropConfig: не удалось прочитать конфигурацию", {
            playFabId: playFabId,
            scriptRevision: revision,
            error: snippet(errText(e))
        });

        return {
            success: false,
            saved: false,
            message: "Не удалось прочитать текущую конфигурацию. " +
                "Настройки не изменены.",
            error: snippet(errText(e))
        };
    }

    var existing = null;

    if (raw) {
        try {
            existing = JSON.parse(raw);
        } catch (e) {
            existing = null;
        }

        if (!bonusChestIsPlainObject(existing)) {
            existing = null;
        }
    }

    var configCorrupt = !!raw && !existing;

    if (!existing) existing = {};

    var existingCooldownMinutes =
        bonusChestSanitizeCooldownMinutes(existing.cooldownMinutes);

    if (!existingCooldownMinutes) {
        existingCooldownMinutes =
            bonusChestLegacyCooldownMinutes(existing.cooldownMs);
    }

    if (!existingCooldownMinutes) {
        existingCooldownMinutes = BONUS_CHEST_DEFAULT_COOLDOWN_MINUTES;
    }

    var cooldownMinutes = hasCooldownArg
        ? requestedCooldownMinutes
        : existingCooldownMinutes;
    var cooldownMs = cooldownMinutes * BONUS_CHEST_MS_PER_MINUTE;

    var updatedAtMs = Date.now();

    // Сохраняем все существующие поля, меняем items, cooldown и метаданные.
    existing.items = validation.items;
    existing.cooldownMinutes = cooldownMinutes;
    existing.cooldownMs = cooldownMs;
    existing.updatedAtMs = updatedAtMs;
    existing.updatedBy = playFabId;
    existing.version = toInt(existing.version) + 1;

    var serialized = JSON.stringify(existing);

    try {
        if (typeof server.SetTitleData !== "function") {
            throw new Error("server.SetTitleData недоступен");
        }

        server.SetTitleData({
            Key: BONUS_CHEST_CONFIG_KEY,
            Value: serialized
        });
    } catch (e) {
        bonusChestDiag("SetDropConfig: ошибка записи Title Data", {
            playFabId: playFabId,
            scriptRevision: revision,
            error: snippet(errText(e))
        });

        return {
            success: false,
            saved: false,
            message: "Не удалось сохранить настройки. Изменения не применены.",
            error: snippet(errText(e))
        };
    }

    BONUS_CHEST_CONFIG_CACHE = null;

    var savedConfig = {
        items: validation.items,
        totalWeight: validation.totalWeight,
        cooldownMinutes: cooldownMinutes,
        cooldownMs: cooldownMs,
        source: "titleData",
        configPresent: true,
        valid: true,
        error: ""
    };

    var payload = bonusChestDropConfigPayload(savedConfig, true);

    payload.saved = true;
    payload.updatedAtMs = updatedAtMs;
    payload.version = existing.version;
    payload.message = "Настройки шансов сохранены";

    bonusChestDiag("SetDropConfig: сохранено", {
        handler: "BonusChest_SetDropConfig",
        playFabId: playFabId,
        scriptRevision: revision,
        totalWeight: validation.totalWeight,
        cooldownMinutes: cooldownMinutes,
        cooldownMs: cooldownMs,
        version: existing.version,
        preservedCooldown: cooldownMs,
        previousConfigCorrupt: configCorrupt
    });

    return payload;
}

// ----------------------------------------------------------------------------
//  Обработчики
// ----------------------------------------------------------------------------

// Канонические имена модуля.
handlers.BonusChest_GetChestBonusStatus = bonusChestGetStatus;
handlers.BonusChest_OpenBonusChest = bonusChestOpen;
handlers.BonusChest_GetDropConfig = bonusChestGetDropConfig;
handlers.BonusChest_SetDropConfig = bonusChestSetDropConfig;

// Совместимость с Unity (BonusChestController.cs вызывает старые имена).
// Эти два присваивания — разрешённые перекрытия старых реализаций
// из CraftingCloudScript.js (см. манифест сборки).
handlers.GetChestBonusStatus = bonusChestGetStatus;
handlers.OpenBonusChest = bonusChestOpen;

// ============================================================================
//  SOURCE: ModerationCloudScript.js — Роли, муты, блокировки, история модерации
//  sha256: c5139a1639b692a144b4a9fed97a3449efc5d9a4599fca599009aecf752f3e62
// ============================================================================

// ============================================================================
//  Last Infinity — серверная система ролей, мутов, блокировок и истории
//  модерации.
//
//  Модуль НЕ создаёт вторую систему регистрации: он работает поверх
//  существующей авторизации Firebase + PlayFab и существующего CloudScript.
//
//  Источник истины:
//    * роли           — Title Data "moderation_roles" (серверный allowlist),
//                       {"admins":["PFID",...],"moderators":["PFID",...]};
//                       для совместимости администраторы из
//                       "craft_admin_playfabids" считаются ADMIN, если их
//                       нет в новом списке (существующие права не меняются);
//    * мут/бан/история — Player Custom Property "moderation_state" игрока,
//                       пишется ТОЛЬКО сервером (клиент изменить не может).
//
//  Клиент НИКОГДА не присылаетmoderatorPlayFabId/role/isAdmin: актор всегда
//  определяется сервером через currentPlayerId (проверенная авторизация).
// ============================================================================

var MODERATION_ROLES_KEY = "moderation_roles";
var MODERATION_LEGACY_ADMINS_KEY = "craft_admin_playfabids";
var MODERATION_STATE_PROP = "moderation_state";
// Presence is stored in a separate property: moderation_state (mutes, bans,
// logs) is never overwritten.
var MODERATION_PRESENCE_PROP = "moderation_presence";

// Client heartbeat: every 30 seconds. A player counts as online only if the
// server saw a heartbeat no older than 120 seconds (server clock).
var MODERATION_PRESENCE_WINDOW_MS = 120000;

// Maximum age of a stored session: the sessions map must not grow endlessly.
var MODERATION_PRESENCE_MAX_SESSION_AGE_MS = 1800000;

var MODERATION_ROLE_PLAYER = "PLAYER";
var MODERATION_ROLE_MODERATOR = "MODERATOR";
var MODERATION_ROLE_ADMIN = "ADMIN";

var MODERATION_ROLES = [MODERATION_ROLE_PLAYER, MODERATION_ROLE_MODERATOR, MODERATION_ROLE_ADMIN];

// Разрешённые сроки мута (минуты). 0 = навсегда.
var MODERATION_MUTE_MINUTES = [5, 15, 30, 60, 1440];

// Разрешённые сроки блокировки (минуты). 0 = навсегда.
var MODERATION_BAN_MINUTES = [60, 360, 720, 1440, 4320, 10080, 43200];

var MODERATION_MAX_REASON = 200;
var MODERATION_MAX_ACTIONS = 12;
var MODERATION_MAX_VIOLATIONS = 8;
var MODERATION_MAX_BATCH = 50;
var MODERATION_MAX_RETRIES = 3;

// ----------------------------------------------------------------------------
//  Вспомогательные функции
// ----------------------------------------------------------------------------

function moderationDiag(message, data) {
    var payload = data || {};

    try {
        payload.message = message;
        payload.serverNowMs = Date.now();

        console.log("[Moderation] " + JSON.stringify(payload));
    } catch (e) {
        console.log("[Moderation] " + message);
    }
}

function moderationNow() {
    return Date.now();
}

function moderationPlainObject(value) {
    return !!value && typeof value === "object" && !(value instanceof Array);
}

// Проверка массива, безопасная для разных «миров» JavaScript:
// обычная проверка instanceof Array не работает для массивов,
// созданных вне песочницы CloudScript.
function moderationIsArray(value) {
    return Object.prototype.toString.call(value) === "[object Array]";
}

function moderationTrim(value) {
    return String(value === undefined || value === null ? "" : value).trim();
}

function moderationTrimReason(value) {
    var text = moderationTrim(value);

    if (text.length > MODERATION_MAX_REASON) {
        text = text.substring(0, MODERATION_MAX_REASON);
    }

    return text;
}

function moderationUniquePush(list, value) {
    for (var i = 0; i < list.length; i++) {
        if (list[i] === value) return true;
    }

    list.push(value);

    return true;
}

function moderationRoleRank(role) {
    if (role === MODERATION_ROLE_ADMIN) return 3;
    if (role === MODERATION_ROLE_MODERATOR) return 2;

    return 1;
}

// ----------------------------------------------------------------------------
//  Роли
// ----------------------------------------------------------------------------

// PlayFab ID нечувствителен к регистру при сравнении, но в Title Data его
// часто вставляют вручную в другом регистре — сравниваем нормализованно.
function moderationNormalizeId(value) {
    return moderationTrim(value).toUpperCase();
}

function moderationReadRoles() {
    var raw = getTitleData(MODERATION_ROLES_KEY);
    var roles = { admins: [], moderators: [] };

    if (!raw) return roles;

    var parsed;

    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        moderationDiag("moderation_roles: повреждённый JSON", {
            key: MODERATION_ROLES_KEY,
            error: snippet(errText(e)),
            rawLength: raw.length
        });

        return roles;
    }

    if (!moderationPlainObject(parsed)) {
        moderationDiag("moderation_roles: неожиданный формат", {
            key: MODERATION_ROLES_KEY
        });

        return roles;
    }

    if (parsed.admins instanceof Array) {
        for (var i = 0; i < parsed.admins.length; i++) {
            var admin = moderationNormalizeId(parsed.admins[i]);

            if (admin) moderationUniquePush(roles.admins, admin);
        }
    }

    if (parsed.moderators instanceof Array) {
        for (var j = 0; j < parsed.moderators.length; j++) {
            var moderator = moderationNormalizeId(parsed.moderators[j]);

            if (moderator) moderationUniquePush(roles.moderators, moderator);
        }
    }

    return roles;
}

function moderationWriteRoles(roles) {
    var payload = {
        admins: roles.admins.slice(),
        moderators: roles.moderators.slice()
    };

    try {
        if (typeof server.SetTitleData !== "function") {
            throw new Error("server.SetTitleData недоступен");
        }

        server.SetTitleData({
            Key: MODERATION_ROLES_KEY,
            Value: JSON.stringify(payload)
        });
    } catch (e) {
        moderationDiag("не удалось сохранить список ролей", {
            error: snippet(errText(e))
        });

        return false;
    }

    return true;
}

// Полное разрешение роли с указанием источника — используется для
// диагностики «почему у меня PLAYER».
function moderationResolveRole(playFabId, roles) {
    var id = moderationNormalizeId(playFabId);
    var result = {
        playFabId: moderationTrim(playFabId),
        normalizedId: id,
        role: MODERATION_ROLE_PLAYER,
        source: "none",
        inAdmins: false,
        inModerators: false,
        inLegacyAdmins: false,
        rolesKeyPresent: false,
        legacyKeyPresent: false,
        adminsCount: 0,
        moderatorsCount: 0
    };

    if (!id) {
        result.source = "empty-playfab-id";
        return result;
    }

    if (roles) {
        result.rolesKeyPresent = true;
        result.adminsCount = roles.admins.length;
        result.moderatorsCount = roles.moderators.length;

        if (roles.admins.indexOf(id) !== -1) {
            result.role = MODERATION_ROLE_ADMIN;
            result.source = "moderation_roles.admins";
            result.inAdmins = true;
            return result;
        }

        if (roles.moderators.indexOf(id) !== -1) {
            result.role = MODERATION_ROLE_MODERATOR;
            result.source = "moderation_roles.moderators";
            result.inModerators = true;
            return result;
        }
    }

    // Запасной источник: старый allowlist администраторов проекта.
    var legacy = getTitleData(MODERATION_LEGACY_ADMINS_KEY);

    if (legacy) {
        result.legacyKeyPresent = true;
        var ids = legacy.split(",");

        for (var i = 0; i < ids.length; i++) {
            if (moderationNormalizeId(ids[i]) === id) {
                result.role = MODERATION_ROLE_ADMIN;
                result.source = "craft_admin_playfabids";
                result.inLegacyAdmins = true;
                return result;
            }
        }
    }

    return result;
}

// Роль игрока. Новый список имеет приоритет; старый craft_admin_playfabids
// используется только как запасной источник ADMIN.
function moderationRoleOf(playFabId, roles) {
    return moderationResolveRole(playFabId, roles).role;
}

function moderationIsAdmin(playFabId, roles) {
    return moderationRoleOf(playFabId, roles) === MODERATION_ROLE_ADMIN;
}

// ----------------------------------------------------------------------------
//  Состояние игрока (Player Custom Property)
// ----------------------------------------------------------------------------

function moderationEmptyState() {
    return {
        mute: null,
        ban: null,
        actions: [],
        violations: [],
        violationCount: 0,
        lastViolationAtMs: 0
    };
}

function moderationParseState(raw) {
    var state = moderationEmptyState();

    if (!raw) return state;

    var parsed;

    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        moderationDiag("moderation_state: повреждённый JSON — состояние сброшено", {
            error: snippet(errText(e))
        });

        return state;
    }

    if (!moderationPlainObject(parsed)) return state;

    if (moderationPlainObject(parsed.mute)) state.mute = parsed.mute;
    if (moderationPlainObject(parsed.ban)) state.ban = parsed.ban;

    if (parsed.actions instanceof Array) state.actions = parsed.actions.slice(0, MODERATION_MAX_ACTIONS);
    if (parsed.violations instanceof Array) state.violations = parsed.violations.slice(0, MODERATION_MAX_VIOLATIONS);

    state.violationCount = toInt(parsed.violationCount);
    state.lastViolationAtMs = toInt(parsed.lastViolationAtMs);

    return state;
}

function moderationLoadState(playFabId) {
    try {
        var response = server.GetPlayerCustomProperty({
            PlayFabId: playFabId,
            PropertyName: MODERATION_STATE_PROP
        });

        var version = 0;

        if (response && typeof response.PropertiesVersion === "number") {
            version = response.PropertiesVersion;
        }

        var hasProperty = !!(response && response.Property &&
            response.Property.Name === MODERATION_STATE_PROP);

        var raw = hasProperty ? String(response.Property.Value || "") : "";

        return {
            ok: true,
            state: moderationParseState(raw),
            version: version,
            hasProperty: hasProperty
        };
    } catch (e) {
        // Отсутствие свойства — это норма для игрока без модерации.
        if (isPropertyMissing(e)) {
            return {
                ok: true,
                state: moderationEmptyState(),
                version: 0,
                hasProperty: false
            };
        }

        return {
            ok: false,
            state: moderationEmptyState(),
            version: 0,
            hasProperty: false,
            error: errText(e)
        };
    }
}

function moderationSaveState(playFabId, state, expectedVersion) {
    try {
        var response = server.UpdatePlayerCustomProperties({
            PlayFabId: playFabId,
            ExpectedPropertiesVersion: expectedVersion,
            Properties: [
                { Name: MODERATION_STATE_PROP, Value: JSON.stringify(state) }
            ]
        });

        if (response && typeof response.PropertiesVersion === "number") {
            return { ok: true };
        }

        return { ok: false, conflict: false, error: "нет ответа UpdatePlayerCustomProperties" };
    } catch (e) {
        return { ok: false, conflict: isVersionConflict(e), error: errText(e) };
    }
}

// Запись состояния с повтором при конфликте версий (CAS).
function moderationStoreState(playFabId, mutate) {
    var attempt = 0;

    while (attempt < MODERATION_MAX_RETRIES) {
        attempt++;

        var loaded = moderationLoadState(playFabId);

        if (!loaded.ok) {
            return { ok: false, error: loaded.error };
        }

        var next = moderationEmptyState();

        next.mute = loaded.state.mute;
        next.ban = loaded.state.ban;
        next.actions = loaded.state.actions.slice();
        next.violations = loaded.state.violations.slice();
        next.violationCount = loaded.state.violationCount;
        next.lastViolationAtMs = loaded.state.lastViolationAtMs;

        var changed = mutate(next);

        if (changed === false) {
            return { ok: true, state: next, version: loaded.version, skipped: true };
        }

        var saved = moderationSaveState(playFabId, next, loaded.version);

        if (saved.ok) {
            return { ok: true, state: next, version: loaded.version };
        }

        if (!saved.conflict) {
            return { ok: false, error: saved.error };
        }
    }

    return { ok: false, error: "конфликт версий при сохранении" };
}

// ----------------------------------------------------------------------------
//  Мут и блокировка
// ----------------------------------------------------------------------------

function moderationMuteActive(mute, now) {
    if (!moderationPlainObject(mute)) return false;
    if (mute.permanent === true) return true;

    return toInt(mute.expiresAtMs) > now;
}

function moderationBanActive(ban, now) {
    if (!moderationPlainObject(ban)) return false;
    if (ban.permanent === true) return true;

    return toInt(ban.expiresAtMs) > now;
}

function moderationResolveDuration(minutes, permanent, allowed) {
    if (permanent === true) return 0;

    var value = toInt(minutes);

    if (value <= 0) return -1;

    for (var i = 0; i < allowed.length; i++) {
        if (allowed[i] === value) return value;
    }

    return -1;
}

// ----------------------------------------------------------------------------
//  Журналы
// ----------------------------------------------------------------------------

function moderationPushAction(state, entry) {
    state.actions.unshift(entry);

    if (state.actions.length > MODERATION_MAX_ACTIONS) {
        state.actions.length = MODERATION_MAX_ACTIONS;
    }
}

function moderationPushViolation(state, entry) {
    state.violations.unshift(entry);

    if (state.violations.length > MODERATION_MAX_VIOLATIONS) {
        state.violations.length = MODERATION_MAX_VIOLATIONS;
    }

    state.violationCount = toInt(state.violationCount) + 1;
    state.lastViolationAtMs = toInt(entry.at);
}

function moderationLastRequestId(state) {
    if (!state.actions || !state.actions.length) return "";

    return moderationTrim(state.actions[0].requestId);
}

// Повтор одного и того же запроса (requestId) не должен выдавать наказание
// дважды. Идентификатор ищется в журнале действий ИНИЦИАТОРА.
function moderationIsDuplicateRequest(actor, requestId) {
    if (!requestId) return false;

    var loaded = moderationLoadState(actor);

    if (!loaded.ok) return false;

    return moderationLastRequestId(loaded.state) === requestId;
}

// ----------------------------------------------------------------------------
//  Общие проверки прав
// ----------------------------------------------------------------------------

function moderationDeny(reason, extra) {
    var result = {
        success: false,
        forbidden: true,
        message: reason
    };

    if (extra) {
        for (var key in extra) {
            if (!extra.hasOwnProperty(key)) continue;
            result[key] = extra[key];
        }
    }

    return result;
}

function moderationTargetId(args) {
    var id = moderationTrim(args && args.playFabId ? args.playFabId : "");

    return id;
}

// Проверка «актор может действовать против цели».
// rules: {mute:true, ban:true, role:true}
function moderationCanActOn(actorRole, targetRole, rules) {
    if (actorRole === MODERATION_ROLE_PLAYER) return false;

    // Модератор не трогает модераторов и администраторов.
    if (actorRole === MODERATION_ROLE_MODERATOR &&
        moderationRoleRank(targetRole) >= moderationRoleRank(MODERATION_ROLE_MODERATOR)) {
        return false;
    }

    // Администратор не трогает других администраторов.
    if (actorRole === MODERATION_ROLE_ADMIN &&
        targetRole === MODERATION_ROLE_ADMIN) {
        return false;
    }

    return true;
}

function moderationActorContext() {
    var actor = moderationTrim(currentPlayerId);
    var roles = moderationReadRoles();
    var resolved = moderationResolveRole(actor, roles);

    return {
        actor: actor,
        role: resolved.role,
        roles: roles,
        resolved: resolved
    };
}

// ----------------------------------------------------------------------------
//  Moderation_GetMyRole
// ----------------------------------------------------------------------------

handlers.Moderation_GetMyRole = function (args, context) {
    var ctx = moderationActorContext();
    var loaded = moderationLoadState(ctx.actor);
    var now = moderationNow();
    var state = loaded.ok ? loaded.state : moderationEmptyState();

    // Диагностика: почему у игрока именно такая роль. Секретных ключей
    // и токенов здесь нет — только идентификатор игрока и результат
    // поиска по серверным спискам.
    var diagnostics = {
        playFabId: ctx.resolved.playFabId,
        normalizedId: ctx.resolved.normalizedId,
        role: ctx.role,
        roleSource: ctx.resolved.source,
        isAdmin: ctx.role === MODERATION_ROLE_ADMIN,
        isModerator: ctx.role === MODERATION_ROLE_MODERATOR,
        inAdmins: ctx.resolved.inAdmins,
        inModerators: ctx.resolved.inModerators,
        inLegacyAdmins: ctx.resolved.inLegacyAdmins,
        rolesKeyPresent: ctx.resolved.rolesKeyPresent,
        legacyKeyPresent: ctx.resolved.legacyKeyPresent,
        adminsCount: ctx.resolved.adminsCount,
        moderatorsCount: ctx.resolved.moderatorsCount,
        stateFound: loaded.ok,
        statePresent: loaded.hasProperty,
        scriptRevision: context && context.revision ? context.revision : "",
        serverNowMs: now
    };

    moderationDiag("Moderation_GetMyRole", diagnostics);

    return {
        success: true,
        role: ctx.role,
        isAdmin: ctx.role === MODERATION_ROLE_ADMIN,
        isModerator: ctx.role === MODERATION_ROLE_MODERATOR,
        canOpenPanel: ctx.role !== MODERATION_ROLE_PLAYER,
        playFabId: ctx.actor,
        serverNowMs: now,
        muted: moderationMuteActive(state.mute, now),
        muteReason: moderationMuteActive(state.mute, now) ? moderationTrim(state.mute.reason) : "",
        muteExpiresAtMs: moderationMuteActive(state.mute, now) ? toInt(state.mute.expiresAtMs) : 0,
        mutePermanent: moderationMuteActive(state.mute, now) ? state.mute.permanent === true : false,
        banned: moderationBanActive(state.ban, now),
        banReason: moderationBanActive(state.ban, now) ? moderationTrim(state.ban.reason) : "",
        banExpiresAtMs: moderationBanActive(state.ban, now) ? toInt(state.ban.expiresAtMs) : 0,
        banPermanent: moderationBanActive(state.ban, now) ? state.ban.permanent === true : false,
        violationCount: state.violationCount,
        muteOptions: MODERATION_MUTE_MINUTES,
        banOptions: MODERATION_BAN_MINUTES,
        diagnostics: diagnostics
    };
};

// ----------------------------------------------------------------------------
//  Moderation_GetChatGuard — серверная проверка мута для чатов
// ----------------------------------------------------------------------------

handlers.Moderation_GetChatGuard = function (args, context) {
    var actor = moderationTrim(currentPlayerId);
    var loaded = moderationLoadState(actor);
    var now = moderationNow();
    var state = loaded.ok ? loaded.state : moderationEmptyState();
    var muted = moderationMuteActive(state.mute, now);
    var banned = moderationBanActive(state.ban, now);

    moderationDiag("Moderation_GetChatGuard", {
        playFabId: actor,
        muted: muted,
        banned: banned
    });

    return {
        success: true,
        playFabId: actor,
        allowed: !muted && !banned,
        muted: muted,
        muteReason: muted ? moderationTrim(state.mute.reason) : "",
        muteExpiresAtMs: muted ? toInt(state.mute.expiresAtMs) : 0,
        mutePermanent: muted ? state.mute.permanent === true : false,
        banned: banned,
        banReason: banned ? moderationTrim(state.ban.reason) : "",
        banExpiresAtMs: banned ? toInt(state.ban.expiresAtMs) : 0,
        serverNowMs: now
    };
};

// ----------------------------------------------------------------------------
//  Moderation_GetPlayers — пакетный запрос состояния игроков
// ----------------------------------------------------------------------------

handlers.Moderation_GetPlayers = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role === MODERATION_ROLE_PLAYER) {
        return moderationDeny("Недостаточно прав для просмотра списка игроков");
    }

    var ids = args && moderationIsArray(args.playFabIds) ? args.playFabIds : [];
    var now = moderationNow();
    var result = [];

    if (ids.length > MODERATION_MAX_BATCH) {
        ids = ids.slice(0, MODERATION_MAX_BATCH);
    }

    for (var i = 0; i < ids.length; i++) {
        var id = moderationTrim(ids[i]);

        if (!id) continue;

        var loaded = moderationLoadState(id);
        var state = loaded.ok ? loaded.state : moderationEmptyState();
        var targetRole = moderationRoleOf(id, ctx.roles);
        var muted = moderationMuteActive(state.mute, now);
        var banned = moderationBanActive(state.ban, now);
        var presence = moderationPresenceOf(id, now);

        result.push({
            playFabId: id,
            role: targetRole,
            muted: muted,
            muteReason: muted ? moderationTrim(state.mute.reason) : "",
            muteExpiresAtMs: muted ? toInt(state.mute.expiresAtMs) : 0,
            mutePermanent: muted ? state.mute.permanent === true : false,
            banned: banned,
            banReason: banned ? moderationTrim(state.ban.reason) : "",
            banExpiresAtMs: banned ? toInt(state.ban.expiresAtMs) : 0,
            banPermanent: banned ? state.ban.permanent === true : false,
            violationCount: state.violationCount,
            lastViolationAtMs: state.lastViolationAtMs,
            // The server counts presence by its own clock: a client cannot
            // report itself as online. No data means not online.
            presenceKnown: presence.known,
            isOnline: presence.isOnline,
            secondsSinceLastSeen: presence.secondsSinceLastSeen,
            lastSeenMs: presence.lastSeenMs,
            // Группы ролей и внутренние журналы другим игрокам не выдаются.
            canModerate: moderationCanActOn(ctx.role, targetRole, {}),
            canManageRole: ctx.role === MODERATION_ROLE_ADMIN && targetRole !== ctx.actor
        });
    }

    return {
        success: true,
        role: ctx.role,
        serverNowMs: now,
        players: result
    };
};

// ----------------------------------------------------------------------------
//  Moderation_GetPlayerDetails
// ----------------------------------------------------------------------------

handlers.Moderation_GetPlayerDetails = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role === MODERATION_ROLE_PLAYER) {
        return moderationDeny("Недостаточно прав для просмотра данных игрока");
    }

    var target = moderationTargetId(args);

    if (!target) {
        return { success: false, validation: true, message: "Не указан PlayFab ID игрока" };
    }

    var loaded = moderationLoadState(target);

    if (!loaded.ok) {
        return {
            success: false,
            message: "Не удалось прочитать данные игрока",
            error: snippet(loaded.error)
        };
    }

    var now = moderationNow();
    var state = loaded.state;
    var targetRole = moderationRoleOf(target, ctx.roles);
    var muted = moderationMuteActive(state.mute, now);
    var banned = moderationBanActive(state.ban, now);

    var details = {
        success: true,
        playFabId: target,
        role: targetRole,
        muted: muted,
        muteReason: muted ? moderationTrim(state.mute.reason) : "",
        muteExpiresAtMs: muted ? toInt(state.mute.expiresAtMs) : 0,
        mutePermanent: muted ? state.mute.permanent === true : false,
        mutedBy: muted ? moderationTrim(state.mute.mutedBy) : "",
        banned: banned,
        banReason: banned ? moderationTrim(state.ban.reason) : "",
        banExpiresAtMs: banned ? toInt(state.ban.expiresAtMs) : 0,
        banPermanent: banned ? state.ban.permanent === true : false,
        bannedBy: banned ? moderationTrim(state.ban.bannedBy) : "",
        violationCount: state.violationCount,
        lastViolationAtMs: state.lastViolationAtMs,
        violations: state.violations,
        canModerate: moderationCanActOn(ctx.role, targetRole, {}),
        canManageRole: ctx.role === MODERATION_ROLE_ADMIN && targetRole !== ctx.actor,
        serverNowMs: now
    };

    // Журнал действий игрока виден только администратору.
    if (ctx.role === MODERATION_ROLE_ADMIN && targetRole !== ctx.actor) {
        details.actions = state.actions;
    }

    return details;
};

// ----------------------------------------------------------------------------
//  Moderation_GetHistory
// ----------------------------------------------------------------------------

handlers.Moderation_GetHistory = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role === MODERATION_ROLE_PLAYER) {
        return moderationDeny("Недостаточно прав для просмотра истории");
    }

    var requested = moderationTrim(args && args.moderatorPlayFabId ? args.moderatorPlayFabId : "");

    if (requested && requested !== ctx.actor && ctx.role !== MODERATION_ROLE_ADMIN) {
        return moderationDeny("Журнал другого модератора доступен только администратору");
    }

    var loaded = moderationLoadState(requested || ctx.actor);

    if (!loaded.ok) {
        return {
            success: false,
            message: "Не удалось прочитать журнал",
            error: snippet(loaded.error)
        };
    }

    return {
        success: true,
        playFabId: requested || ctx.actor,
        role: ctx.role,
        actions: loaded.state.actions,
        serverNowMs: moderationNow()
    };
};

// ----------------------------------------------------------------------------
//  Moderation_ApplyMute / Moderation_RemoveMute
// ----------------------------------------------------------------------------

// --------------------------------------------------------------------------
//  Presence (heartbeat)
// --------------------------------------------------------------------------

function moderationEmptyPresence() {
    return {
        lastSeenMs: 0,
        sessionEnded: false,
        sessionCount: 0,
        sessions: {}
    };
}

function moderationParsePresence(raw) {
    var presence = moderationEmptyPresence();

    if (!raw) return presence;

    var parsed;

    try {
        parsed = JSON.parse(raw);
    } catch (e) {
        moderationDiag("moderation_presence: broken JSON", {
            error: snippet(errText(e))
        });

        return presence;
    }

    if (!moderationPlainObject(parsed)) return presence;

    presence.lastSeenMs = toInt(parsed.lastSeenMs);
    presence.sessionEnded = parsed.sessionEnded === true;
    presence.sessionCount = toInt(parsed.sessionCount);

    if (moderationPlainObject(parsed.sessions)) {
        presence.sessions = parsed.sessions;
    }

    return presence;
}

function moderationLoadPresence(playFabId) {
    try {
        var response = server.GetPlayerCustomProperty({
            PlayFabId: playFabId,
            PropertyName: MODERATION_PRESENCE_PROP
        });

        var version = 0;

        if (response && typeof response.PropertiesVersion === "number") {
            version = response.PropertiesVersion;
        }

        var hasProperty = !!(response && response.Property &&
            response.Property.Name === MODERATION_PRESENCE_PROP);

        var raw = hasProperty ? String(response.Property.Value || "") : "";

        return {
            ok: true,
            presence: moderationParsePresence(raw),
            version: version,
            hasProperty: hasProperty
        };
    } catch (e) {
        if (isPropertyMissing(e)) {
            return {
                ok: true,
                presence: moderationEmptyPresence(),
                version: 0,
                hasProperty: false
            };
        }

        return {
            ok: false,
            presence: moderationEmptyPresence(),
            version: 0,
            hasProperty: false,
            error: errText(e)
        };
    }
}

function moderationSavePresence(playFabId, presence, expectedVersion) {
    try {
        var response = server.UpdatePlayerCustomProperties({
            PlayFabId: playFabId,
            ExpectedPropertiesVersion: expectedVersion,
            Properties: [
                { Name: MODERATION_PRESENCE_PROP, Value: JSON.stringify(presence) }
            ]
        });

        if (response && typeof response.PropertiesVersion === "number") {
            return { ok: true };
        }

        return { ok: false, conflict: false, error: "no UpdatePlayerCustomProperties response" };
    } catch (e) {
        return { ok: false, conflict: isVersionConflict(e), error: errText(e) };
    }
}


function moderationPresenceOf(playFabId, now) {
    var loaded = moderationLoadPresence(playFabId);

    if (!loaded.ok || !loaded.hasProperty) {
        return {
            known: false,
            isOnline: false,
            secondsSinceLastSeen: -1,
            lastSeenMs: 0
        };
    }

    var presence = loaded.presence;
    var lastSeen = 0;
    var online = false;

    var sessions = moderationPlainObject(presence.sessions)
        ? presence.sessions
        : {};

    for (var id in sessions) {
        if (!sessions.hasOwnProperty(id)) continue;

        var session = sessions[id];

        if (!moderationPlainObject(session)) continue;

        var seen = toInt(session.lastSeenMs);

        if (seen > lastSeen) lastSeen = seen;

        if (session.ended === true) continue;

        var elapsed = now - seen;

        if (elapsed < 0) elapsed = 0;

        if (elapsed <= MODERATION_PRESENCE_WINDOW_MS) online = true;
    }

    if (lastSeen <= 0) {
        return {
            known: false,
            isOnline: false,
            secondsSinceLastSeen: -1,
            lastSeenMs: 0
        };
    }

    var since = now - lastSeen;

    if (since < 0) since = 0;

    return {
        known: true,
        isOnline: online,
        secondsSinceLastSeen: Math.floor(since / 1000),
        lastSeenMs: lastSeen
    };
}

// Идентификатор сессии клиента: GUID-подобная строка.
function moderationSessionId(value) {
    var id = moderationTrim(value);

    if (!id || id.length > 64) return "";

    for (var i = 0; i < id.length; i++) {
        var ch = id.charAt(i);
        var ok = (ch >= "0" && ch <= "9") || (ch >= "a" && ch <= "z") ||
            (ch >= "A" && ch <= "Z") || ch === "-" || ch === "_";

        if (!ok) return "";
    }

    return id;
}



handlers.Moderation_Heartbeat = function (args, context) {
    var actor = moderationTrim(currentPlayerId);

    if (!actor) {
        return {
            success: false,
            forbidden: true,
            message: "Cannot resolve the player"
        };
    }

    var sessionId = moderationSessionId(
        args && args.sessionId ? args.sessionId : "");

    if (!sessionId) {
        return {
            success: false,
            validation: true,
            message: "sessionId is required"
        };
    }

    var ending = !!(args && args.ending === true);
    var now = moderationNow();
    var attempt = 0;
    var saved = null;

    while (attempt < MODERATION_MAX_RETRIES) {
        attempt++;

        var loaded = moderationLoadPresence(actor);

        if (!loaded.ok) {
            saved = { ok: false, error: loaded.error };
            break;
        }

        var presence = loaded.presence;

        if (!moderationPlainObject(presence.sessions)) {
            presence.sessions = {};
        }

        var sessions = presence.sessions;
        var session = moderationPlainObject(sessions[sessionId])
            ? sessions[sessionId]
            : null;

        if (ending) {
            // Finishing a session touches ONLY this session.
            // An unknown (stale) session is ignored.
            if (session) {
                session.ended = true;
                session.lastSeenMs = now;
            } else {
                moderationDiag("Moderation_Heartbeat: завершение неизвестной сессии", {
                    playFabId: actor,
                    sessionId: sessionId
                });
            }
        } else if (session) {
            if (session.ended === true) {
                // The session is already finished - a late heartbeat does
                // not revive it. A new session gets a new sessionId.
                moderationDiag("Moderation_Heartbeat: поздний heartbeat завершённой сессии", {
                    playFabId: actor,
                    sessionId: sessionId
                });
            } else {
                session.lastSeenMs = now;
            }
        } else {
            // A new session (first launch or a repeated login).
            sessions[sessionId] = {
                lastSeenMs: now,
                ended: false
            };

            presence.sessionCount = toInt(presence.sessionCount) + 1;
        }

        // Summary fields and cleanup of the stale sessions.
        var lastSeen = 0;
        var anyActive = false;

        for (var id in sessions) {
            if (!sessions.hasOwnProperty(id)) continue;

            var item = sessions[id];

            if (!moderationPlainObject(item)) {
                delete sessions[id];
                continue;
            }

            var seen = toInt(item.lastSeenMs);

            if (seen > lastSeen) lastSeen = seen;

            if (now - seen > MODERATION_PRESENCE_MAX_SESSION_AGE_MS) {
                delete sessions[id];
                continue;
            }

            if (item.ended !== true &&
                now - seen <= MODERATION_PRESENCE_WINDOW_MS) {
                anyActive = true;
            }
        }

        presence.lastSeenMs = lastSeen;
        presence.sessionEnded = !anyActive;

        var write = moderationSavePresence(actor, presence, loaded.version);

        if (write.ok) {
            saved = { ok: true, presence: presence, lastSeenMs: lastSeen };
            break;
        }

        if (!write.conflict) {
            saved = { ok: false, error: write.error };
            break;
        }
    }

    if (!saved || !saved.ok) {
        return {
            success: false,
            message: "Failed to update presence",
            error: snippet(saved && saved.error ? saved.error : "")
        };
    }

    return {
        success: true,
        playFabId: actor,
        sessionId: sessionId,
        lastSeenMs: saved.lastSeenMs || now,
        serverNowMs: now,
        sessionEnded: ending,
        onlineWindowMs: MODERATION_PRESENCE_WINDOW_MS,
        sessionCount: toInt(saved.presence.sessionCount)
    };
};

// --------------------------------------------------------------------------
//  Mute and ban
// --------------------------------------------------------------------------

handlers.Moderation_ApplyMute = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role === MODERATION_ROLE_PLAYER) {
        return moderationDeny("Недостаточно прав для выдачи мута");
    }

    var target = moderationTargetId(args);

    if (!target) {
        return { success: false, validation: true, message: "Не указан PlayFab ID игрока" };
    }

    if (target === ctx.actor) {
        return moderationDeny("Нельзя выдать мут самому себе");
    }

    var targetRole = moderationRoleOf(target, ctx.roles);

    if (!moderationCanActOn(ctx.role, targetRole, {})) {
        return moderationDeny("Недостаточно прав для выдачи мута этому игроку", {
            targetRole: targetRole
        });
    }

    var permanent = !!(args && args.permanent === true);
    var minutes = moderationResolveDuration(
        args && args.durationMinutes !== undefined ? args.durationMinutes : 0,
        permanent,
        MODERATION_MUTE_MINUTES
    );

    if (minutes < 0) {
        return {
            success: false,
            validation: true,
            message: "Недопустимый срок мута. Разрешено: " +
                MODERATION_MUTE_MINUTES.join(", ") + " минут или навсегда"
        };
    }

    var reason = moderationTrimReason(args && args.reason ? args.reason : "");

    if (!reason) {
        return { success: false, validation: true, message: "Укажите причину мута" };
    }

    var requestId = moderationTrim(args && args.requestId ? args.requestId : "");
    var now = moderationNow();
    var expiresAtMs = minutes === 0 ? 0 : now + minutes * 60 * 1000;

    // Повтор того же запроса не дублирует наказание.
    if (moderationIsDuplicateRequest(ctx.actor, requestId)) {
        var duplicateLoaded = moderationLoadState(target);
        var duplicateState = duplicateLoaded.ok ?
            duplicateLoaded.state : moderationEmptyState();
        var duplicateMuted = moderationMuteActive(duplicateState.mute, now);

        return {
            success: true,
            saved: true,
            duplicate: true,
            playFabId: target,
            muted: duplicateMuted,
            muteReason: duplicateMuted ? moderationTrim(duplicateState.mute.reason) : "",
            muteExpiresAtMs: duplicateMuted ? toInt(duplicateState.mute.expiresAtMs) : 0,
            mutePermanent: duplicateMuted ? duplicateState.mute.permanent === true : false,
            serverNowMs: now
        };
    }

    var applied = false;

    // Запись состояния цели.
    var stored = moderationStoreState(target, function (state) {
        state.mute = {
            mutedBy: ctx.actor,
            reason: reason,
            issuedAtMs: now,
            expiresAtMs: expiresAtMs,
            permanent: minutes === 0
        };

        moderationPushViolation(state, {
            t: now,
            act: "mute",
            by: ctx.actor,
            reason: reason,
            expiresAtMs: expiresAtMs,
            permanent: minutes === 0
        });

        applied = true;

        return true;
    });

    if (!stored.ok) {
        return {
            success: false,
            message: "Не удалось сохранить мут",
            error: snippet(stored.error)
        };
    }

    // Запись в журнал действий модератора.
    moderationStoreState(ctx.actor, function (state) {
        moderationPushAction(state, {
            t: now,
            act: "mute",
            target: target,
            reason: reason,
            expiresAtMs: expiresAtMs,
            permanent: minutes === 0,
            ok: true,
            requestId: requestId
        });

        return true;
    });

    moderationDiag("Moderation_ApplyMute", {
        actor: ctx.actor,
        actorRole: ctx.role,
        target: target,
        targetRole: targetRole,
        minutes: minutes,
        duplicate: false,
        applied: applied
    });

    return {
        success: true,
        saved: true,
        duplicate: false,
        playFabId: target,
        muted: true,
        muteReason: reason,
        muteExpiresAtMs: expiresAtMs,
        mutePermanent: minutes === 0,
        serverNowMs: now
    };
};

handlers.Moderation_RemoveMute = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role === MODERATION_ROLE_PLAYER) {
        return moderationDeny("Недостаточно прав для снятия мута");
    }

    var target = moderationTargetId(args);

    if (!target) {
        return { success: false, validation: true, message: "Не указан PlayFab ID игрока" };
    }

    var targetRole = moderationRoleOf(target, ctx.roles);

    if (!moderationCanActOn(ctx.role, targetRole, {})) {
        return moderationDeny("Недостаточно прав для снятия мута у этого игрока", {
            targetRole: targetRole
        });
    }

    var reason = moderationTrimReason(args && args.reason ? args.reason : "");
    var requestId = moderationTrim(args && args.requestId ? args.requestId : "");
    var now = moderationNow();
    var hadMute = false;

    // Повтор того же запроса не дублирует действие.
    if (moderationIsDuplicateRequest(ctx.actor, requestId)) {
        var unmuteDuplicate = moderationLoadState(target);
        var unmuteState = unmuteDuplicate.ok ?
            unmuteDuplicate.state : moderationEmptyState();
        var unmuteActive = moderationMuteActive(unmuteState.mute, now);

        return {
            success: true,
            saved: true,
            duplicate: true,
            playFabId: target,
            muted: unmuteActive,
            serverNowMs: now
        };
    }

    var stored = moderationStoreState(target, function (state) {
        hadMute = !!state.mute;
        state.mute = null;

        moderationPushViolation(state, {
            t: now,
            act: "unmute",
            by: ctx.actor,
            reason: reason,
            expiresAtMs: 0,
            permanent: false
        });

        return true;
    });

    if (!stored.ok) {
        return {
            success: false,
            message: "Не удалось снять мут",
            error: snippet(stored.error)
        };
    }

    moderationStoreState(ctx.actor, function (state) {
        moderationPushAction(state, {
            t: now,
            act: "unmute",
            target: target,
            reason: reason,
            expiresAtMs: 0,
            permanent: false,
            ok: true,
            requestId: requestId
        });

        return true;
    });

    moderationDiag("Moderation_RemoveMute", {
        actor: ctx.actor,
        actorRole: ctx.role,
        target: target,
        hadMute: hadMute,
        duplicate: false
    });

    return {
        success: true,
        saved: true,
        duplicate: false,
        playFabId: target,
        muted: false,
        serverNowMs: now
    };
};

// ----------------------------------------------------------------------------
//  Moderation_ApplyBan / Moderation_RemoveBan
//
//  Важно: реальный бан PlayFab выполняется только через Admin API с
//  Developer Secret Key (доверенный backend). CloudScript не имеет доступа к
//  BanUsers, поэтому сервер фиксирует НАМЕРЕНИЕ бана и возвращает
//  requiresBackend=true — клиент не должен сообщать об успехе раньше
//  подтверждения от backend.
// ----------------------------------------------------------------------------

handlers.Moderation_ApplyBan = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role !== MODERATION_ROLE_ADMIN) {
        return moderationDeny("Выдавать блокировки может только администратор");
    }

    var target = moderationTargetId(args);

    if (!target) {
        return { success: false, validation: true, message: "Не указан PlayFab ID игрока" };
    }

    if (target === ctx.actor) {
        return moderationDeny("Нельзя заблокировать самого себя");
    }

    var targetRole = moderationRoleOf(target, ctx.roles);

    if (!moderationCanActOn(ctx.role, targetRole, {})) {
        return moderationDeny("Нельзя заблокировать администратора", {
            targetRole: targetRole
        });
    }

    var permanent = !!(args && args.permanent === true);
    var minutes = moderationResolveDuration(
        args && args.durationMinutes !== undefined ? args.durationMinutes : 0,
        permanent,
        MODERATION_BAN_MINUTES
    );

    if (minutes < 0) {
        return {
            success: false,
            validation: true,
            message: "Недопустимый срок блокировки. Разрешено: " +
                MODERATION_BAN_MINUTES.join(", ") + " минут или навсегда"
        };
    }

    var reason = moderationTrimReason(args && args.reason ? args.reason : "");
    var requestId = moderationTrim(args && args.requestId ? args.requestId : "");
    var now = moderationNow();
    var expiresAtMs = minutes === 0 ? 0 : now + minutes * 60 * 1000;

    // Повтор того же запроса не дублирует наказание.
    if (moderationIsDuplicateRequest(ctx.actor, requestId)) {
        var banDuplicate = moderationLoadState(target);
        var banState = banDuplicate.ok ?
            banDuplicate.state : moderationEmptyState();
        var banActive = moderationBanActive(banState.ban, now);

        return {
            success: true,
            saved: true,
            duplicate: true,
            playFabId: target,
            banned: banActive,
            banReason: banActive ? moderationTrim(banState.ban.reason) : "",
            banExpiresAtMs: banActive ? toInt(banState.ban.expiresAtMs) : 0,
            banPermanent: banActive ? banState.ban.permanent === true : false,
            playFabBanApplied: false,
            requiresBackend: true,
            serverNowMs: now
        };
    }

    var stored = moderationStoreState(target, function (state) {
        state.ban = {
            bannedBy: ctx.actor,
            reason: reason,
            issuedAtMs: now,
            expiresAtMs: expiresAtMs,
            permanent: minutes === 0,
            playFabBanApplied: false
        };

        moderationPushViolation(state, {
            t: now,
            act: "ban",
            by: ctx.actor,
            reason: reason,
            expiresAtMs: expiresAtMs,
            permanent: minutes === 0
        });

        return true;
    });

    if (!stored.ok) {
        return {
            success: false,
            message: "Не удалось сохранить блокировку",
            error: snippet(stored.error)
        };
    }

    moderationStoreState(ctx.actor, function (state) {
        moderationPushAction(state, {
            t: now,
            act: "ban",
            target: target,
            reason: reason,
            expiresAtMs: expiresAtMs,
            permanent: minutes === 0,
            ok: true,
            requestId: requestId
        });

        return true;
    });

    moderationDiag("Moderation_ApplyBan", {
        actor: ctx.actor,
        target: target,
        targetRole: targetRole,
        minutes: minutes,
        duplicate: false
    });

    return {
        success: true,
        saved: true,
        duplicate: false,
        playFabId: target,
        banned: true,
        banReason: reason,
        banExpiresAtMs: expiresAtMs,
        banPermanent: minutes === 0,
        // Реальный бан PlayFab требует Developer Secret Key: только backend.
        playFabBanApplied: false,
        requiresBackend: true,
        serverNowMs: now
    };
};

handlers.Moderation_RemoveBan = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role !== MODERATION_ROLE_ADMIN) {
        return moderationDeny("Снимать блокировки может только администратор");
    }

    var target = moderationTargetId(args);

    if (!target) {
        return { success: false, validation: true, message: "Не указан PlayFab ID игрока" };
    }

    var targetRole = moderationRoleOf(target, ctx.roles);

    if (!moderationCanActOn(ctx.role, targetRole, {})) {
        return moderationDeny("Нельзя снять блокировку с администратора", {
            targetRole: targetRole
        });
    }

    var reason = moderationTrimReason(args && args.reason ? args.reason : "");
    var requestId = moderationTrim(args && args.requestId ? args.requestId : "");
    var now = moderationNow();

    // Повтор того же запроса не дублирует действие.
    if (moderationIsDuplicateRequest(ctx.actor, requestId)) {
        return {
            success: true,
            saved: true,
            duplicate: true,
            playFabId: target,
            banned: false,
            requiresBackend: true,
            serverNowMs: now
        };
    }

    var stored = moderationStoreState(target, function (state) {
        state.ban = null;

        moderationPushViolation(state, {
            t: now,
            act: "unban",
            by: ctx.actor,
            reason: reason,
            expiresAtMs: 0,
            permanent: false
        });

        return true;
    });

    if (!stored.ok) {
        return {
            success: false,
            message: "Не удалось снять блокировку",
            error: snippet(stored.error)
        };
    }

    moderationStoreState(ctx.actor, function (state) {
        moderationPushAction(state, {
            t: now,
            act: "unban",
            target: target,
            reason: reason,
            expiresAtMs: 0,
            permanent: false,
            ok: true,
            requestId: requestId
        });

        return true;
    });

    moderationDiag("Moderation_RemoveBan", {
        actor: ctx.actor,
        target: target,
        duplicate: false
    });

    return {
        success: true,
        saved: true,
        duplicate: false,
        playFabId: target,
        banned: false,
        requiresBackend: true,
        serverNowMs: now
    };
};

// ----------------------------------------------------------------------------
//  Moderation_SetRole
// ----------------------------------------------------------------------------

handlers.Moderation_SetRole = function (args, context) {
    var ctx = moderationActorContext();

    if (ctx.role !== MODERATION_ROLE_ADMIN) {
        return moderationDeny("Назначать и снимать роли может только администратор");
    }

    var target = moderationTargetId(args);

    if (!target) {
        return { success: false, validation: true, message: "Не указан PlayFab ID игрока" };
    }

    if (target === ctx.actor) {
        return moderationDeny("Нельзя изменить собственную роль");
    }

    var role = moderationTrim(args && args.role ? args.role : "").toUpperCase();

    if (MODERATION_ROLES.indexOf(role) === -1) {
        return {
            success: false,
            validation: true,
            message: "Неизвестная роль. Допустимо: " + MODERATION_ROLES.join(", ")
        };
    }

    var requestId = moderationTrim(args && args.requestId ? args.requestId : "");
    var now = moderationNow();
    var roles = moderationReadRoles();
    var targetNormalized = moderationNormalizeId(target);
    var previousRole = moderationRoleOf(targetNormalized, roles);

    // Модератор не может выдать права выше своих — правило уже отсекает
    // сам факт вызова (только ADMIN), но проверяем явно.
    if (moderationRoleRank(role) > moderationRoleRank(ctx.role)) {
        return moderationDeny("Нельзя назначить роль выше собственной");
    }

    if (role === MODERATION_ROLE_ADMIN && previousRole !== MODERATION_ROLE_ADMIN) {
        moderationUniquePush(roles.admins, targetNormalized);
        roles.moderators = roles.moderators.filter(function (id) {
            return id !== targetNormalized;
        });
    } else if (role === MODERATION_ROLE_MODERATOR) {
        roles.admins = roles.admins.filter(function (id) {
            return id !== targetNormalized;
        });

        moderationUniquePush(roles.moderators, targetNormalized);
    } else {
        roles.admins = roles.admins.filter(function (id) {
            return id !== targetNormalized;
        });

        roles.moderators = roles.moderators.filter(function (id) {
            return id !== targetNormalized;
        });
    }

    // Защита от снятия последнего администратора.
    if (previousRole === MODERATION_ROLE_ADMIN && role !== MODERATION_ROLE_ADMIN) {
        var remainingAdmins = 0;

        for (var i = 0; i < roles.admins.length; i++) {
            if (moderationRoleOf(roles.admins[i], roles) === MODERATION_ROLE_ADMIN) {
                remainingAdmins++;
            }
        }

        if (remainingAdmins < 1) {
            return moderationDeny("Нельзя снять роль у последнего администратора");
        }
    }

    if (!moderationWriteRoles(roles)) {
        return {
            success: false,
            message: "Не удалось сохранить список ролей"
        };
    }

    if (requestId) {
        moderationStoreState(ctx.actor, function (state) {
            moderationPushAction(state, {
                t: now,
                act: "role",
                target: target,
                reason: previousRole + " -> " + role,
                expiresAtMs: 0,
                permanent: false,
                ok: true,
                requestId: requestId
            });

            return true;
        });
    }

    moderationDiag("Moderation_SetRole", {
        actor: ctx.actor,
        actorRole: ctx.role,
        actorRoleSource: ctx.resolved.source,
        target: target,
        targetNormalized: targetNormalized,
        previousRole: previousRole,
        newRole: role,
        adminsCount: roles.admins.length,
        moderatorsCount: roles.moderators.length
    });

    return {
        success: true,
        saved: true,
        playFabId: target,
        role: role,
        previousRole: previousRole,
        serverNowMs: now
    };
};

handlers.Moderation_SetPlayerRole = function (args, context) {
    return handlers.Moderation_SetRole(args, context);
};

var MODERATION_KEY = 'moderation_state';

function modNormalizeId(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/^\s+|\s+$/g, '').toUpperCase();
}

// Идентификатор инициатора — только серверный, из глобальной переменной.
function modCallerId(context) {
    if (typeof currentPlayerId !== 'undefined' && currentPlayerId) {
        return currentPlayerId;
    }

    // Запасной вариант для ревизий, где currentPlayerId всё же есть в context.
    if (context && context.currentPlayerId) return context.currentPlayerId;

    return '';
}

function modLog(tag, data) {
    try {
        log.info('[Moderation] ' + tag + ': ' + JSON.stringify(data));
    } catch (e) {
        log.info('[Moderation] ' + tag);
    }
}

// Единая проверка полномочий. Возвращает подробную диагностику, чтобы
// клиент/logs видели причину отказа, а не только «недостаточно прав».
function modResolveAdmin(context) {
    var caller = modNormalizeId(modCallerId(context));

    var result = {
        callerPlayFabId: caller,
        source: 'none',
        rolesKeyPresent: false,
        legacyKeyPresent: false,
        adminsCount: 0,
        moderatorsCount: 0,
        inAdmins: false,
        inLegacyAdmins: false,
        isAdmin: false,
        reason: ''
    };

    if (!caller) {
        result.reason = 'пустой currentPlayerId (сервер не определил инициатора)';
        modLog('admin-check', result);
        return result;
    }

    var title = server.GetTitleData({
        Keys: ['moderation_roles', 'craft_admin_playfabids']
    });

    var data = (title && title.Data) ? title.Data : {};

    var rolesRaw = data.moderation_roles;
    var legacyRaw = data.craft_admin_playfabids;

    result.rolesKeyPresent = !!rolesRaw && String(rolesRaw).length > 0;
    result.legacyKeyPresent = !!legacyRaw && String(legacyRaw).length > 0;

    var roles = {};

    if (result.rolesKeyPresent) {
        try {
            roles = JSON.parse(rolesRaw);
        } catch (e) {
            roles = {};
        }
    }

    var admins = [];

    // duck-typing вместо instanceof Array: массивы из JSON.parse могут быть
    // из другой realm (и в тестах, и в некоторых ревизиях CloudScript).
    if (roles.admins && typeof roles.admins.length === 'number') {
        admins = roles.admins.map(modNormalizeId);
    }

    if (roles.moderators && typeof roles.moderators.length === 'number') {
        result.moderatorsCount = roles.moderators.length;
    }

    var legacy = [];

    if (result.legacyKeyPresent) {
        try {
            legacy = JSON.parse(legacyRaw);
        } catch (e2) {
            legacy = [];
        }
    }

    if (typeof legacy.length === 'number') {
        legacy = legacy.map(modNormalizeId);
    }

    result.adminsCount = admins.length;
    result.inAdmins = admins.indexOf(caller) >= 0;
    result.inLegacyAdmins = legacy.indexOf(caller) >= 0;
    result.isAdmin = result.inAdmins || result.inLegacyAdmins;

    if (result.inAdmins) {
        result.source = 'moderation_roles.admins';
    } else if (result.inLegacyAdmins) {
        result.source = 'craft_admin_playfabids';
    } else if (!result.rolesKeyPresent && !result.legacyKeyPresent) {
        result.source = 'none';
        result.reason = 'Title Data с списками администраторов отсутствует';
    } else {
        result.source = 'none';
        result.reason = 'PlayFab ID не найден ни в одном списке администраторов';
    }

    modLog('admin-check', result);

    return result;
}

// Общая проверка для всех административных операций этого модуля.
function modIsAdmin(context) {
    return modResolveAdmin(context).isAdmin;
}

function modDeny(context) {
    var info = modResolveAdmin(context);

    return {
        success: false,
        saved: false,
        adminCheck: false,
        message: 'Недостаточно прав администратора',
        diagnostics: info
    };
}

// Диагностика последнего чтения Internal Data. Ошибка чтения НЕ должна
// превращаться в «verified=true, blocked=false» — это разрешило бы вход.
var modLastReadError = null;

function modReadState(playFabId) {
    modLastReadError = null;

    modLog('state-read-start', {
        playFabId: playFabId,
        key: MODERATION_KEY
    });

    var result;

    try {
        result = server.GetUserInternalData({
            PlayFabId: playFabId,
            Keys: [MODERATION_KEY]
        });
    } catch (apiError) {
        modLastReadError = 'GetUserInternalData: ' +
            (apiError && apiError.message ? apiError.message : String(apiError));

        modLog('state-read-json-error', {
            playFabId: playFabId,
            error: modLastReadError
        });
        return {};
    }

    var data = (result && result.Data) ? result.Data : {};
    var record = data[MODERATION_KEY];

    if (!record) {
        // Записи нет — это не ошибка, но факт фиксируем в логе.
        modLog('state-read-empty', {
            playFabId: playFabId,
            key: MODERATION_KEY
        });
        return {};
    }

    // GetUserInternalData возвращает UserDataRecord: JSON-строка лежит
    // в record.Value. Старый строковый формат тоже поддерживаем.
    var json = null;

    if (typeof record === 'string') {
        json = record;
    } else if (typeof record.Value === 'string') {
        json = record.Value;
    } else {
        modLastReadError = 'UserDataRecord без строкового Value';

        modLog('state-read-json-error', {
            playFabId: playFabId,
            error: modLastReadError,
            recordType: typeof record
        });
        return {};
    }

    if (!json || json.length === 0) {
        modLog('state-read-empty', {
            playFabId: playFabId,
            key: MODERATION_KEY,
            detail: 'пустая строка Value'
        });
        return {};
    }

    var parsed;

    try {
        parsed = JSON.parse(json);
    } catch (parseError) {
        modLastReadError = 'JSON.parse: ' +
            (parseError && parseError.message
                ? parseError.message
                : String(parseError));

        modLog('state-read-json-error', {
            playFabId: playFabId,
            error: modLastReadError
        });
        return {};
    }

    if (!parsed || typeof parsed !== 'object' ||
        typeof parsed.length === 'number') {
        modLastReadError = 'разобранное значение не является объектом состояния';

        modLog('state-read-json-error', {
            playFabId: playFabId,
            error: modLastReadError
        });
        return {};
    }

    modLog('state-read-ok', {
        playFabId: playFabId,
        fields: Object.keys(parsed)
    });

    return parsed;
}

function modWriteState(playFabId, state) {
    var payload = {};
    payload[MODERATION_KEY] = JSON.stringify(state);

    server.UpdateUserInternalData({
        PlayFabId: playFabId,
        Data: payload
    });
}

function modAllowedDuration(permanent, minutes) {
    if (permanent === true) return true;
    return [60, 360, 720, 1440, 4320, 10080, 43200].indexOf(minutes) >= 0;
}

// -----------------------------------------------------------------------------
// БЛОКИРОВКА
// -----------------------------------------------------------------------------

handlers.Moderation_ApplyBan = function (args, context) {
    if (!modIsAdmin(context)) return modDeny(context);

    var target = String(args.playFabId || '').trim();
    var reason = String(args.reason || '').trim();

    if (!target) return { success: false, message: 'Не указан PlayFab ID игрока' };
    if (!reason) return { success: false, message: 'Укажите причину блокировки' };

    var permanent = args.permanent === true;
    var minutes = parseInt(args.durationMinutes, 10);

    if (isNaN(minutes)) minutes = 0;

    if (!modAllowedDuration(permanent, minutes)) {
        return { success: false, validation: true,
                 message: 'Недопустимый срок блокировки' };
    }

    var state = modReadState(target);

    // Не перезаписываем состояние, если не удалось его прочитать: иначе
    // можно потерять mute/actions и другие поля игрока.
    if (modLastReadError) {
        return {
            success: false,
            saved: false,
            message: 'Ошибка чтения состояния игрока: ' + modLastReadError
        };
    }

    var now = Date.now();

    var expiresAt = null;

    if (!permanent) {
        expiresAt = now + minutes * 60 * 1000;
    }

    var adminInfo = modResolveAdmin(context);

    var ban = {
        PlayFabId: target,
        FirebaseUID: state.FirebaseUID || args.firebaseUid || null,
        IsBlocked: true,
        Reason: reason,
        BlockedAt: now,
        BlockedBy: adminInfo.callerPlayFabId,
        ExpiresAt: expiresAt,
        Permanent: permanent
    };

    state.ban = ban;
    state.banned = true;
    state.banReason = reason;
    state.banPermanent = permanent;
    state.banIssuedAtMs = now;
    state.banExpiresAtMs = expiresAt ? expiresAt : 0;

    if (!state.actions) state.actions = [];
    state.actions.push({
        t: now,
        act: 'ban',
        target: target,
        reason: reason,
        ok: true,
        requestId: args.requestId || null
    });

    if (state.actions.length > 12) state.actions.splice(0, state.actions.length - 12);

    modWriteState(target, state);

    modLog('ban-saved', {
        target: target,
        by: adminInfo.callerPlayFabId,
        source: adminInfo.source,
        permanent: permanent
    });

    return {
        success: true,
        saved: true,
        banned: true,
        banReason: reason,
        banIssuedAtMs: now,
        banExpiresAtMs: expiresAt ? expiresAt : 0,
        banPermanent: permanent,
        playFabBanApplied: false,
        requiresBackend: false,
        message: 'Блокировка сохранена'
    };
};

// -----------------------------------------------------------------------------
// РАЗБЛОКИРОВКА
// -----------------------------------------------------------------------------

handlers.Moderation_RemoveBan = function (args, context) {
    if (!modIsAdmin(context)) return modDeny(context);

    var target = String(args.playFabId || '').trim();

    if (!target) return { success: false, message: 'Не указан PlayFab ID игрока' };

    var state = modReadState(target);

    if (modLastReadError) {
        return {
            success: false,
            saved: false,
            message: 'Ошибка чтения состояния игрока: ' + modLastReadError
        };
    }

    var now = Date.now();

    state.ban = null;
    state.banned = false;
    state.banReason = '';
    state.banIssuedAtMs = 0;
    state.banExpiresAtMs = 0;
    state.banPermanent = false;

    if (!state.actions) state.actions = [];
    state.actions.push({
        t: now,
        act: 'unban',
        target: target,
        reason: String(args.reason || ''),
        ok: true,
        requestId: args.requestId || null
    });

    if (state.actions.length > 12) state.actions.splice(0, state.actions.length - 12);

    modWriteState(target, state);

    modLog('ban-removed', {
        target: target,
        by: modNormalizeId(modCallerId(context))
    });

    return {
        success: true,
        saved: true,
        banned: false,
        requiresBackend: false,
        message: 'Блокировка снята'
    };
};

// -----------------------------------------------------------------------------
// ПРОВЕРКА СТАТУСА БЛОКИРОВКИ ДЛЯ ВХОДА В ИГРУ
// -----------------------------------------------------------------------------
//
// Читает ровно те данные, которые пишет Moderation_ApplyBan
// (User Internal Data, ключ moderation_state). modReadState() из общего модуля
// используется повторно — второй источник истины не создаётся.
//
// Ответ всегда содержит success=true, если вызов дошёл до сервера: клиент
// различает «сервер подтвердил отсутствие бана» и «сервер недоступен» по
// presence поля verified, а не по сетевому ok.
handlers.Moderation_GetBanStatus = function (args, context) {
    var caller = modNormalizeId(modCallerId(context));

    if (!caller) {
        return {
            success: false,
            verified: false,
            reason: 'currentPlayerId пуст — сервер не определил игрока'
        };
    }

    // По умолчанию проверяем самого вызывающего (вход в игру). Администратор
    // может запросить статус другого игрока для админ-панели. Доверяем только
    // серверному caller — клиентские isAdmin/role игнорируются.
    var target = caller;
    var requested = modNormalizeId(args && args.playFabId);

    if (requested && requested !== caller) {
        if (!modIsAdmin(context)) {
            return {
                success: false,
                verified: false,
                adminCheck: false,
                reason: 'Недостаточно прав для проверки другого игрока'
            };
        }

        target = requested;
    }

    var state = modReadState(target);

    // Ошибка чтения НЕ означает «бана нет» — fail closed.
    if (modLastReadError) {
        modLog('ban-status', {
            playFabId: target,
            verified: false,
            error: modLastReadError,
            stage: 'login-check'
        });

        return {
            success: false,
            verified: false,
            reason: 'Ошибка чтения состояния: ' + modLastReadError
        };
    }

    var now = Date.now();

    var storedBan = state.ban || null;
    var blocked = false;
    var reason = '';
    var issuedAt = 0;
    var expiresAt = 0;
    var permanent = false;

    if (storedBan) {
        blocked = storedBan.IsBlocked === true || state.banned === true;
        reason = String(storedBan.Reason || state.banReason || '');
        issuedAt = parseInt(storedBan.BlockedAt, 10) ||
            parseInt(state.banIssuedAtMs, 10) || 0;
        permanent = storedBan.Permanent === true || state.banPermanent === true;
        expiresAt = storedBan.ExpiresAt
            ? parseInt(storedBan.ExpiresAt, 10)
            : (parseInt(state.banExpiresAtMs, 10) || 0);
    } else {
        // Запасные поля на случай старых записей, где ban-объекта нет.
        blocked = state.banned === true;
        reason = String(state.banReason || '');
        permanent = state.banPermanent === true;
        issuedAt = parseInt(state.banIssuedAtMs, 10) || 0;
        expiresAt = parseInt(state.banExpiresAtMs, 10) || 0;
    }

    // Временный бан с истёкшим сроком не блокирует вход.
    var expired = false;

    if (blocked && !permanent && expiresAt > 0 && expiresAt <= now) {
        blocked = false;
        expired = true;
    }

    var reply = {
        success: true,
        verified: true,
        playFabId: target,
        blocked: blocked,
        reason: reason,
        blockedAtMs: issuedAt,
        expiresAtMs: permanent ? 0 : expiresAt,
        permanent: permanent,
        expired: expired,
        serverNowMs: now,
        source: 'moderation_state (User Internal Data)',
        stage: target === caller ? 'login-check' : 'admin-check',
        message: blocked
            ? 'Аккаунт заблокирован'
            : (expired ? 'Срок блокировки истёк' : 'Блокировок нет')
    };

    modLog('ban-status', {
        playFabId: target,
        blocked: blocked,
        expired: expired,
        source: reply.source,
        stage: reply.stage
    });

    return reply;
};

// -----------------------------------------------------------------------------
// СПИСОК ЗАБЛОКИРОВАННЫХ ИГРОКОВ (для админ-панели)
// -----------------------------------------------------------------------------
//
// Internal Data недоступна обычному Unity-клиенту, поэтому читаем её здесь.
// Список ID приходит с клиента (текущая загруженная страница), жёстко
// ограничен — сервер не сканирует произвольное количество игроков.
handlers.Moderation_GetBannedPlayers = function (args, context) {
    if (!modIsAdmin(context)) return modDeny(context);

    var ids = (args && args.playFabIds && typeof args.playFabIds.length === 'number')
        ? args.playFabIds
        : [];

    if (ids.length > 100) ids = ids.slice(0, 100);

    var now = Date.now();
    var unique = {};
    var result = [];
    var checked = 0;
    var errors = 0;

    for (var i = 0; i < ids.length; i++) {
        var id = modNormalizeId(ids[i]);

        if (!id || unique[id]) continue;
        unique[id] = true;
        checked++;

        var state = modReadState(id);

        if (modLastReadError) {
            errors++;
            // При ошибке чтения не выдаём «не заблокирован» — пропускаем игрока
            // и сообщаем количество ошибок в diagnostics.
            continue;
        }

        var b = state.ban || null;

        if (!b && state.banned !== true) continue;

        var isPermanent = (b && b.Permanent === true) || state.banPermanent === true;
        var expiresAt = b && b.ExpiresAt
            ? parseInt(b.ExpiresAt, 10)
            : (parseInt(state.banExpiresAtMs, 10) || 0);

        if (!isPermanent && expiresAt > 0 && expiresAt <= now) continue;

        result.push({
            playFabId: id,
            banned: true,
            reason: String((b && b.Reason) || state.banReason || ''),
            blockedAtMs: (b && parseInt(b.BlockedAt, 10)) ||
                parseInt(state.banIssuedAtMs, 10) || 0,
            expiresAtMs: isPermanent ? 0 : expiresAt,
            permanent: isPermanent,
            blockedBy: (b && b.BlockedBy) || ''
        });
    }

    modLog('banned-list', {
        requested: ids.length,
        checked: checked,
        found: result.length,
        readErrors: errors
    });

    return {
        success: errors === 0,
        players: result,
        checked: checked,
        readErrors: errors,
        diagnostics: errors > 0
            ? { readErrors: errors, detail: 'часть статусов не прочитана' }
            : null,
        message: errors > 0
            ? 'Не удалось прочитать часть статусов блокировки'
            : 'Список заблокированных получен'
    };
};
// LASTINFINITY_GITHUB_SYNC_TEST_2026






