<?php
//ChatObject:
 
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