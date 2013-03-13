<?php

/*

var nullPos = users.indexOf(null);
var insertPos = nullPos === -1? users.length : nullPos;
users[insertPos] = 'NEW NICK';

*/

// The ID:s would continue to grow.. if you leave and rejoin
// you would have to go through to get the first "hole" in array/list
// Arrays in JS are objects.

var $arrUserList = array('djazz', 'jammsen'); // 0, 1
var $arrRoomList = array('System', 'Room1'); // 0, 1
$userLookup = array(
    array( // djazz, id 0

        // i think this can be in any order too, so just push

        0, // this is the id of room System
        1
    ),
    array( // jammsen, id 1
        1
    )
);
$roomLookup = array(
    array(
        0 // only djazz is in System
    ),
    array(
        1,
        0 // both are in Room1
    )
);
// djazz is in System and Room1. jammsen is in Room1
// to easily see who is in what room
// yeah


// from scratch? i need something fresh

// i think this is the most optimal hmm
$localUserSettings = array(
    array(
        array(
            'ready' => false, // djazz is not ready in System
            'color' => 'orange'
        )
    ),
    array( // Room1

        // The order here doesn't matter!

        array( // first user in room, which here is 1 (jammsen)
            'ready' => true,
            'color' => 'navy'
        ),
        array(
            'ready' => false, // djazz is not ready in Room1
            'color' => 'green'
        )
    )
);



var RoomManagerObject = {
    'users': {
        'djazz': {
            'rooms': ['Room1', 'Room2'],
            'settings': {'admin': true}
        },
        'jammsen': {
            'rooms': ['Room1'],
            'settings': {}
        }
    },
    'rooms': {
        'default': {
            'name': 'default',
            'users': {
                'djazz': {
                    'nick': 'djazz',
                    'settings': {
                        'ready': false,
                        'color': 'orange'
                    },
                    'node': LI
                },
                'jammsen': {
                    'nick': 'jammsen',
                    'settings': {
                        'ready': true,
                        'color': 'blue'
                    },
                    'node': LI
                }
            },
            'settings': {
                'topic': 'This is the default room',
                'created': Date
            },
            'node': UL
        },
        'nodejs': {
            'name': 'nodejs',
            'users': {
                'ryah': {
                    'nick': 'ryah',
                    'settings': {
                        'ready': false,
                        'color': 'red'
                    },
                    'node': LI
                },
                'djazz': {
                    'nick': 'djazz',
                    'settings': {
                        'ready': true,
                        'color': 'pink'
                    },
                    'node': LI
                },
            },
            'settings': {
                'topic': 'Version 0.10.0 released!',
                'created': Date
            },
            'node': UL
        }
    }
}

$info = array(
    'RoomManger' => array(
        'UserRooms' => array(
            'djazz' => array(
                'Room1', 'Room2'
            )
        ),
        'Room1' => array(
            'User' => array(
                'djazz' => array(
                    'nickname' => 'djazz',
                    'settings' => array(
                        'ready' => false,
                        'color' => 'navy'
                    ),
                ),
                'jammsen' => array(
                    'nickname' => 'jammsen',
                    'settings' => array(
                        'ready' => true,
                        'color' => 'lightblue'
                    ),
                )
            ),
            'Roomsettings' => array(
                'topic' => 'This is the default Room1 of djazz.mine.nu:9000',
                'moderated' => false,
                'creator' => 'djazz-does-all:)',
                'leavable' => false
            )
        ),
        'Room2' => array(
            'User' => array(
                'AdminGod' => array(
                    'nickname' => 'AdminGod',
                    'settings' => array(
                        'ready' => true,
                        'color' => 'white'
                    ),
                ),
                'djazz' => array(
                    'nickname' => 'djazz',
                    'settings' => array(
                        'ready' => false,
                        'color' => 'navy'
                    ),
                ),
            ),
        ),
    )
);