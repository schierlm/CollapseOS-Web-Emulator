( based on collapseos/emul/z80/xcomp.fs )
$ff00 VALUE RS_ADDR
$fffa VALUE PS_ADDR
RS_ADDR $90 - VALUE SYSVARS
SYSVARS $80 + VALUE GRID_MEM
$4000 VALUE HERESTART
ARCHM Z80A XCOMPL Z80H
XCOMPH Z80C COREL Z80H ASMH
: _ ( n blk( -- ) SWAP ( blk( n )
  ( n ) 256 /MOD 3 PC! 3 PC! ( blkid )
  ( blk( ) 256 /MOD 3 PC! 3 PC! ( dest ) ;
: (blk@) 1 3 PC! ( read ) _ ;
: (blk!) 2 3 PC! ( write ) _ ;
BLKSUB
: (emit) 0 PC! ;
: (key?) 0 PC@ 0 = IF 0 PC@ 1 ELSE 0 THEN ;
: COLS 80 ; : LINES 25 ;
: CURSOR! ( new old -- )
    DROP COLS /MOD 100 + 5 PC! ( y ) 5 PC! ( x ) ;
: CELL! ( c pos -- ) 0 CURSOR! 0 PC! ;

( scrollback buffer )
: NEWLN ( old -- new )
  1+ DUP LINES = IF 1- 255 5 PC! THEN
  DUP 200 + 5 PC! ;
GRIDSUB
: INIT BLK$ GRID$ ;
XWRAP
