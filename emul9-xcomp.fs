( based on collapseos/vm/xcomp.fs )
$ff00 VALUE SYSVARS
SYSVARS $409 - VALUE BLK_MEM
$fffa VALUE OUTADDR
$fff8 VALUE INADDR

ARCHM XCOMP 6502A 6502M ( #=301 #=200 #=302 #=303 #=304 #=305 #=007 #=309 )

XCOMPC ( #=201 #=202 #=203 #=204 #=205 )
$400 XSTART
6502C ( #=310 #=311 #=312 #=313 #=314 #=315 #=316 #=317 )
      ( #=318 #=319 #=320 #=321 )
COREL ( #=210 #=211 #=212 #=213 #=214 #=215 #=216 #=217 )
      ( #=218 #=219 #=220 #=221 #=222 #=223 #=224 )

CODE (emit)
  0 <X+> LDA, INX, INX,
  OUTADDR 1+ () STA, 1 # LDA, OUTADDR () STA, ;CODE
CODE (key?)
  DEX, DEX, DEX, DEX,
  0 # LDA, 3 <X+> STA, 1 <X+> STA, 1 # LDA, 0 <X+> STA,
  INADDR () STA, INADDR 1+ () LDA, 2 <X+> STA, ;CODE
: (blk@) $fff4 ! $fff6 ! 1 $fff3 C! ;
: (blk!) $fff4 ! $fff6 ! 2 $fff3 C! ;
BLKSUB ( #=230 #=231 #=232 #=233 #=234 )
: INIT BLK$ ;
( COREH ) ( #=225 #=226 #=227 #=228 #=229 )
XWRAP
