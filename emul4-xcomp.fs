( based on collapseos/emul/z80/xcomp.fs )
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR
RS_ADDR 0xb0 - CONSTANT SYSVARS
SYSVARS 0xa0 + CONSTANT GRID_MEM
0x4000 CONSTANT HERESTART
5 LOAD  ( z80 assembler )
280 LOAD  ( boot.z80.decl )
200 205 LOADR  ( xcomp )
281 303 LOADR ( boot.z80 )
210 231 LOADR  ( forth core low )
: (emit) 0 PC! ;
: (key?) 0 PC@ 0 = IF 0 PC@ 1 ELSE 0 THEN ;
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
: CURSOR! ( new old -- )
    DROP COLS /MOD 6 PC! ( y ) 5 PC! ( x ) ;
: CELL! ( c pos -- ) 0 CURSOR! 0 PC! ;

( scrollback buffer )
: NEWLN ( ln ln -- ln )
  DUP 0 = IF DROP DROP 24 24 LF 1999 CELL! THEN
  COLS * DUP COLS + 1- SWAP DO SPC I CELL! LOOP ;

240 241 LOADR ( Grid )
236 239 LOADR ( forth core high )
XWRAP" BLK$ ' EFS@ ' BLK@* **! ' EFS! ' BLK!* **! GRID$ "
