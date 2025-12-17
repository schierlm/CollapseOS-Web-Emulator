( based on collapseos/emul/z80/xcomp.fs )
2 CONSTS $ff00 RS_ADDR $fffa PS_ADDR
RS_ADDR $90 - VALUE SYSVARS
SYSVARS $409 - VALUE BLK_MEM
SYSVARS $80 + VALUE RXTX_MEM
$4000 VALUE HERESTART
ARCHM XCOMP Z80A XCOMPC Z80C COREL
: _currdisk [ SYSVARS $80 + LITN ] ;
: _ ( n blk( -- ) SWAP ( blk( n )
  ( n ) 256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( blkid )
  ( blk( ) 256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( dest ) ;
: (blk@) 1 3 _currdisk C@ + PC! ( read ) _ ;
: (blk!) 2 3 _currdisk C@ + PC! ( write ) _ ;
: TX> 15 PC! ; : RX<? 15 PC@ 1 ;
BLKSUB
: (emit) 0 PC! ;
: (key?) 0 PC@ 0 = IF 0 PC@ 1 ELSE 0 THEN ;
: SELDISK FLUSH 0 = IF 0 ELSE 10 THEN _currdisk C! ;
: SERIAL@ 15 PC@ ;
: SERIAL! 15 PC! ;
RXTXSUB
: INIT BLK$ 0 SELDISK ;
XWRAP
