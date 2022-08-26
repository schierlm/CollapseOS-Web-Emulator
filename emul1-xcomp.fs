( based on collapseos/emul/z80/xcomp.fs )
2 CONSTS $ff00 RS_ADDR $fffa PS_ADDR
RS_ADDR $80 - VALUE SYSVARS
SYSVARS $409 - VALUE BLK_MEM
$4000 VALUE HERESTART
ARCHM XCOMP Z80A XCOMPC Z80C COREL
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
