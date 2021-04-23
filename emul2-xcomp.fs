( based on collapseos/emul/z80/xcomp.fs )
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR
RS_ADDR 0xa0 - CONSTANT SYSVARS
0x4000 CONSTANT HERESTART
5 LOAD  ( z80 assembler )
280 LOAD  ( boot.z80.decl )
200 205 LOADR  ( xcomp )
281 303 LOADR ( boot.z80 )
210 231 LOADR  ( forth core low )
: _currdisk [ SYSVARS 0x42 + LITN ] ;
: (emit) 0 PC! ;
: (key?) 0 PC@ 0 = IF 0 PC@ 1 ELSE 0 THEN ;
: EFS@
    1 3 _currdisk C@ + PC! ( read )
    256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( blkid )
    BLK( 256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( dest )
;
: EFS!
    2 3 _currdisk C@ + PC! ( write )
    256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( blkid )
    BLK( 256 /MOD 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( dest )
;
: SELDISK 0 = IF 0 ELSE 10 THEN _currdisk C! ;
: SERIAL@ 15 PC@ ;
: SERIAL! 15 PC! ;

236 239 LOADR ( forth core high )
XWRAP" BLK$ 0 SELDISK ' EFS@ ' BLK@* **! ' EFS! ' BLK!* **! "
