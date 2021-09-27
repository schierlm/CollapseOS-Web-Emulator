( based on collapseos/emul/z80/xcomp.fs )
$ff00 VALUE RS_ADDR
$fffa VALUE PS_ADDR
RS_ADDR $90 - VALUE SYSVARS
$4000 VALUE HERESTART
ARCHM Z80A XCOMPL Z80H
XCOMPH Z80C COREL Z80H ASMH
: _currdisk [ SYSVARS $80 + LITN ] ;
: _ ( n blk( -- ) SWAP ( blk( n )
  ( n ) 256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( blkid )
  ( blk( ) 256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( dest ) ;
: (blk@) 1 3 _currdisk C@ + PC! ( read ) _ ;
: (blk!) 2 3 _currdisk C@ + PC! ( write ) _ ;
BLKSUB
: (emit) 0 PC! ;
: (key?) 0 PC@ 0 = IF 0 PC@ 1 ELSE 0 THEN ;
: SELDISK FLUSH 0 = IF 0 ELSE 10 THEN _currdisk C! ;
: SERIAL@ 15 PC@ ;
: SERIAL! 15 PC! ;
: INIT BLK$ 0 SELDISK ;
XWRAP
