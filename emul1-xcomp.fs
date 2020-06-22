( based on collapseos/emul/xcomp.fs )
0x4000 CONSTANT RAMSTART
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR
212 LOAD  ( z80 assembler )
262 LOAD  ( xcomp )
270 LOAD  ( xcomp overrides )

282 LOAD  ( boot.z80 )
353 LOAD  ( xcomp core low )
: (emit) 0 PC! ;
: (key) BEGIN 0 PC@ 0 = UNTIL 0 PC@ ;
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
: COLS 80 ; : LINES 25 ;
: AT-XY 6 PC! ( y ) 5 PC! ( x ) ;

380 LOAD  ( xcomp core high )
(entry) _
( Update LATEST )
PC ORG @ 8 + !
," BLK$ "
," ' EFS@ BLK@* ! "
," ' EFS! BLK!* ! "
EOT,
ORG @ 256 /MOD 2 PC! 2 PC!
H@ 256 /MOD 2 PC! 2 PC!
