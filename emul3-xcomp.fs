( based on collapseos/emul/z80/xcomp.fs )
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR
RS_ADDR 0xb0 - CONSTANT SYSVARS
0x4000 CONSTANT HERESTART
0xbf   CONSTANT TMS_CTLPORT
0xbe   CONSTANT TMS_DATAPORT
SYSVARS 0xa0 + CONSTANT GRID_MEM
SYSVARS 0xa3 + CONSTANT CPORT_MEM
0x3f   CONSTANT CPORT_CTL
0xdc   CONSTANT CPORT_D1
0xdd   CONSTANT CPORT_D2
SYSVARS 0xa4 + CONSTANT PAD_MEM
5 LOAD  ( z80 assembler )
: ZFILL, ( u ) 0 DO 0 A, LOOP ;
262 263 LOADR ( font compiler )
280 LOAD  ( boot.z80.decl )
200 205 LOADR ( xcomp )
281 303 LOADR ( boot.z80 )
210 231 LOADR ( forth core low )
CREATE ~FNT CPFNT7x7
315 317 LOADR ( TMS9918 )
330 332 LOADR ( VDP )
240 241 LOADR ( Grid )
348 349 LOADR ( SMS ports )
335 338 LOADR ( PAD )

: (key?) ( -- c? f )
  _next C@ IF _next C@ 0 _next C! 1 EXIT THEN
  _updsel IF
    0 PC@ 0 = IF 0 PC@ 1 EXIT THEN
    _prevstat C@
    0x20 ( BUTC ) OVER AND NOT IF DROP _sel C@ 1 EXIT THEN
    0x40 ( BUTA ) AND NOT IF 0x8 ( BS ) 1 EXIT THEN
    ( If not BUTC or BUTA, it has to be START )
    0xd _next C! _sel C@ 1
    ELSE 0 ( f ) THEN ;

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
236 239 LOADR ( forth core high )
XWRAP" VDP$ GRID$ PAD$ BLK$ ' EFS@ ' BLK@* **! ' EFS! ' BLK!* **! "
