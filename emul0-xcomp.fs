( based on collapseos/cvm/{common,forth}.fs )
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR
RS_ADDR 0xb0 - CONSTANT SYSVARS
SYSVARS 0xa0 + CONSTANT GRID_MEM
0x4000 CONSTANT HERESTART
2 LOAD ( assembler common words #=002 )
200 204 LOADR ( xcomp low #=200 #=201 #=202 #=203 #=204 )
CREATE nativeidx 0 ,
: NATIVE CODE nativeidx @ DUP C, 1+ nativeidx ! ;
205 LOAD ( xcomp high #=205 )

HERE ORG !

( start here for pass 1 bootstrap ###P1### )

0x11 ALLOT0
( END OF STABLE ABI )
( 11 SUFLW ) 12 C, ," PS underflow"
( 1e SOFLW ) 8 C, ," overflow"
HERE 4 + XCURRENT ! ( make next CODE have 0 prev field )
NATIVE EXIT
NATIVE (br)
NATIVE (?br)
NATIVE (loop)
NATIVE (b)
NATIVE (n)
NATIVE (s)
NATIVE >R
NATIVE R>
NATIVE 2>R
NATIVE 2R>
NATIVE EXECUTE
NATIVE ROT
NATIVE DUP
NATIVE ?DUP
NATIVE DROP
NATIVE SWAP
NATIVE OVER
NATIVE 2DROP
NATIVE 2DUP
NATIVE 'S
NATIVE AND
NATIVE OR
NATIVE XOR
NATIVE NOT
NATIVE +
NATIVE -
NATIVE *
NATIVE /MOD
NATIVE !
NATIVE @
NATIVE C!
NATIVE C@
NATIVE PC!
NATIVE PC@
NATIVE I
NATIVE I'
NATIVE J
NATIVE BYE
NATIVE ABORT
NATIVE QUIT
NATIVE []=
NATIVE =
NATIVE <
NATIVE >
NATIVE FIND
NATIVE 1+
NATIVE 1-
NATIVE RSHIFT
NATIVE LSHIFT
NATIVE TICKS
NATIVE ROT>
NATIVE |L
NATIVE |M
NATIVE CRC16

210 231 LOADR ( forth low #=210 #=211 #=212 #=213 #=214 #=215 #=216 #=217 #=218 #=219 #=220 #=221 )
( #=222 #=223 #=224 #=225 #=226 #=227 #=228 #=229 #=230 #=231 )

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

( fork between stage and forth begins here )

: COLS 80 ; : LINES 25 ;
: CURSOR! ( new old -- )
    DROP COLS /MOD 100 + 5 PC! ( y ) 5 PC! ( x ) ;
: CELL! ( c pos -- ) 0 CURSOR! 0 PC! ;

( scrollback buffer )
: NEWLN ( ln ln -- ln )
  DUP 0 = IF DROP DROP 24 24 255 5 PC! THEN
  200 + 5 PC! ;

240 241 LOADR ( Grid #=240 #=241 )

: INIT$
  BLK$ 0 SELDISK GRID$ ;

236 239 LOADR ( forth high #=236 #=237 #=238 #=239 )
XWRAP" INIT$ ' EFS@ ' BLK@* **! ' EFS! ' BLK!* **!"
