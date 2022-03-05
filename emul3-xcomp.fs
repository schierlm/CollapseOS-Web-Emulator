( based on collapseos/emul/z80/xcomp.fs / collapseos/arch/z80/sms/xcomp.fs )
2 CONSTS $ff00 RS_ADDR $fffa PS_ADDR
RS_ADDR $90 - CONSTANT SYSVARS
SYSVARS $80 + CONSTANT GRID_MEM
SYSVARS $83 + CONSTANT CPORT_MEM
SYSVARS $84 + CONSTANT PAD_MEM
SYSVARS $409 - CONSTANT BLK_MEM
$4000 CONSTANT HERESTART
$bf   CONSTANT TMS_CTLPORT
$be   CONSTANT TMS_DATAPORT
$3f   CONSTANT CPORT_CTL
$dc   CONSTANT CPORT_D1
$dd   CONSTANT CPORT_D2

ARCHM XCOMP Z80A FONTC
XCOMPC Z80C COREL

CREATE ~FNT CPFNT7x7

335 337 LOADR ( TMS9918 )
350 352 LOADR ( VDP )
GRIDSUB
368 369 LOADR ( SMS ports )
355 358 LOADR ( PAD )

: (key?) ( -- c? f )
  _next C@ IF _next C@ 0 _next C! 1 EXIT THEN
  _updsel IF
    0 PC@ 0 = IF 0 PC@ 1 EXIT THEN
    _prevstat C@
    $20 ( BUTC ) OVER AND NOT IF DROP _sel C@ 1 EXIT THEN
    $40 ( BUTA ) AND NOT IF $8 ( BS ) 1 EXIT THEN
    ( If not BUTC or BUTA, it has to be START )
    $d _next C! _sel C@ 1
    ELSE 0 ( f ) THEN ;

: _ ( n blk( -- ) SWAP ( blk( n )
  ( n ) 256 /MOD 3 PC! 3 PC! ( blkid )
  ( blk( ) 256 /MOD 3 PC! 3 PC! ( dest ) ;
: (blk@) 1 3 PC! ( read ) _ ;
: (blk!) 2 3 PC! ( write ) _ ;
BLKSUB


: INIT VDP$ GRID$ PAD$ BLK$ ;
XWRAP
