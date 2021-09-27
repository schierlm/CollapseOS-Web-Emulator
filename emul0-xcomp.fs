( based on collapseos/cvm/{common,grid}.fs )
2 VALUES PS_ADDR $fffa RS_ADDR $ff00
RS_ADDR $90 - VALUE SYSVARS
SYSVARS $80 + VALUE GRID_MEM
$4000 VALUE HERESTART
\ # 0 VALUE JROFF 1 VALUE JROPLEN

ARCHM ASML XCOMPL (  #=002 #=200 )
\ # : COREH ;
CVMH ( #=304 #=305 #=306 #=307 #=308 )
ASMH ( #=003 )
XCOMPH ( #=201 #=202 #=203 #=204 #=205 )

( start here for pass 1 bootstrap ###P1### )

CVMC ( #=302 #=303 )
COREL ( #=207 #=208 #=209 #=210 #=211 #=212 #=213 #=214 #=215 )
      ( #=216 #=217 #=218 #=219 #=220 #=221 #=222 #=223 #=224 )
CVMH ( #=304 #=305 #=306 #=307 #=308 )
ASMH ( #=003 )

: _currdisk [ SYSVARS $84 + LITN ] ;
: (key?) 0 PC@ 0 = IF 0 PC@ 1 ELSE 0 THEN ;
: (emit) 0 PC! ;
: _ ( n blk( -- ) SWAP ( blk( n )
  ( n ) L|M 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( blkid )
  ( blk( ) L|M 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( dest ) ;
: (blk@) 1 3 _currdisk C@ + PC! ( read ) _ ;
: (blk!) 2 3 _currdisk C@ + PC! ( write ) _ ;

BLKSUB ( #=230 #=231 #=232 #=233 #=234 )
: SELDISK FLUSH 0 = IF 0 ELSE 10 THEN _currdisk C! ;
: SERIAL@ 15 PC@ ;
: SERIAL! 15 PC! ;

\ fork between grid and serial begins here

: COLS 80 ; : LINES 25 ;
: CURSOR! ( new old -- )
    DROP COLS /MOD 100 + 5 PC! ( y ) 5 PC! ( x ) ;
: CELL! ( c pos -- ) 0 CURSOR! 0 PC! ;

( scrollback buffer )
: NEWLN ( old -- new )
  1+ DUP LINES = IF 1- 255 5 PC! THEN
  DUP 200 + 5 PC! ;

GRIDSUB ( #=240 #=241 )
: INIT BLK$ 0 SELDISK GRID$ ;
( COREH ) ( #=225 #=226 #=227 #=228 #=229 )
XWRAP
