( based on collapseos/emul/xcomp.fs )
0x4000 CONSTANT RAMSTART
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR
212 LOAD  ( z80 assembler )
262 LOAD  ( xcomp )
270 LOAD  ( xcomp overrides )

282 LOAD  ( boot.z80 )
353 LOAD  ( xcomp core low )
: _currdisk [ RAMSTART 0x70 + LITN ] ;
: (emit) 0 PC! ;
: (key) BEGIN 0 PC@ 0 = UNTIL 0 PC@ ;
: EFS@
    256 /MOD 3 _currdisk C@ + PC! 3 _currdisk C@ + PC!
    1024 0 DO
        4 _currdisk C@ + PC@
        BLK( I + C!
    LOOP
;
: EFS!
    256 /MOD 3 _currdisk C@ + PC! 3 _currdisk C@ + PC!
    1024 0 DO
        BLK( I + C@ 4 _currdisk C@ + PC!
    LOOP
;
: SELDISK 0 = IF 0 ELSE 10 THEN _currdisk C! ;
: SERIAL@ 15 PC@ ;
: SERIAL! 15 PC! ;
: COLS 80 ; : LINES 25 ;
: AT-XY 6 PC! ( y ) 5 PC! ( x ) ;

380 LOAD  ( xcomp core high )
(entry) _
( Update LATEST )
PC ORG @ 8 + !
," BLK$ 0 SELDISK "
," ' EFS@ BLK@* ! "
," ' EFS! BLK!* ! "
EOT,
ORG @ 256 /MOD 2 PC! 2 PC!
H@ 256 /MOD 2 PC! 2 PC!
