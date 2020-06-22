( based on collapseos/emul/xcomp.fs )
0x4000 CONSTANT RAMSTART
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR
RAMSTART 0x70 + CONSTANT VDP_MEM
0xbf   CONSTANT VDP_CTLPORT
0xbe   CONSTANT VDP_DATAPORT
32     CONSTANT VDP_COLS
24     CONSTANT VDP_ROWS
RAMSTART 0x72 + CONSTANT PAD_MEM
0x3f   CONSTANT PAD_CTLPORT
0xdc   CONSTANT PAD_D1PORT
212 LOAD  ( z80 assembler )
: ZFILL, ( u ) 0 DO 0 A, LOOP ;
262 LOAD  ( xcomp )
524 LOAD  ( font compiler )
270 LOAD  ( xcomp overrides )
282 LOAD  ( boot.z80 )
353 LOAD  ( xcomp core low )
CREATE ~FNT CPFNT7x7
623 628 LOADR ( VDP )
632 635 LOADR ( PAD 1 )
: (key)
    _next C@ IF _next C@ 0 _next C! EXIT THEN
    BEGIN _updsel UNTIL
    0 PC@ 0 = IF 0 PC@ EXIT THEN
    _prevstat C@
    0x20 ( BUTC ) OVER AND NOT IF DROP _sel C@ EXIT THEN
    0x40 ( BUTA ) AND NOT IF 0x8 ( BS ) EXIT THEN
    ( If not BUTC or BUTA, it has to be START )
    0xd _next C! _sel C@
;
637 LOAD ( PAD 2 )
: EFS@
    1 3 PC! ( read )
    256 /MOD 3 PC! 3 PC! ( blkid )
    BLK( 256 /MOD 3 PC! 3 PC! ( dest )
;
: EFS!
    2 3 PC! ( write )
    256 /MOD 3 PC! 3 PC! ( blkid )
    BLK( 256 /MOD 3 PC! 3 PC! ( dest )
;
: COLS 32 ; : LINES 24 ;
: AT-XY 6 PC! ( y ) 5 PC! ( x ) ;
380 LOAD  ( xcomp core high )
(entry) _
( Update LATEST )
PC ORG @ 8 + !
," VDP$ PAD$ BLK$ "
," ' EFS@ BLK@* ! "
," ' EFS! BLK!* ! "
EOT,
ORG @ 256 /MOD 2 PC! 2 PC!
H@ 256 /MOD 2 PC! 2 PC!
