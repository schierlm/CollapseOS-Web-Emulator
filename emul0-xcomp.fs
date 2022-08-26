( based on collapseos/cvm/{common,grid}.fs )
2 CONSTS $fffa PS_ADDR $ff00 RS_ADDR
$fe00 VALUE SYSVARS
SYSVARS $409 - VALUE BLK_MEM
SYSVARS $80 + VALUE GRID_MEM
GRID_MEM 2 + VALUE RXTX_MEM
$4000 VALUE HERESTART
\ # 0 VALUE JROFF 1 VALUE JROPLEN

ARCHM XCOMP (  #=301 #=200 )
\ # : COREH ;
CVMA ( #=306 )
XCOMPC ( #=201 #=202 #=203 #=204 #=205 )

( start here for pass 1 bootstrap ###P1### )

CVMC ( #=302 #=303 #=304 #=305 )
COREL ( #=210 #=211 #=212 #=213 #=214 #=215 #=216 #=217 )
      ( #=218 #=219 #=220 #=221 #=222 #=223 #=224 )

: _currdisk [ SYSVARS $84 + LITN ] ;
: (key?) 0 PC@ 0 = IF 0 PC@ 1 ELSE 0 THEN ;
: _ ( n blk( -- ) SWAP ( blk( n )
  ( n ) L|M 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( blkid )
  ( blk( ) L|M 3 _currdisk C@ + PC!
        3 _currdisk C@ + PC! ( dest ) ;
: (blk@) 1 3 _currdisk C@ + PC! ( read ) _ ;
: (blk!) 2 3 _currdisk C@ + PC! ( write ) _ ;
: TX> 15 PC! ; : RX<? 15 PC@ 1 ;

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
RXTXSUB ( #=235 )
: INIT BLK$ 0 SELDISK GRID$ ;
( COREH ) ( #=225 #=226 #=227 #=228 #=229 )
XWRAP
