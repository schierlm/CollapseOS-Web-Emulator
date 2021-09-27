( based on collapseos/emul/z80/xcomp.fs )
$ff00 VALUE RS_ADDR
$fffa VALUE PS_ADDR
RS_ADDR $80 - VALUE SYSVARS
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
: INIT BLK$ ;
XWRAP
