( ----- 000 )
CVM MASTER INDEX

301 CVM boot code
306 CVM assembler
309 Common drivers
310 Grid drivers
( ----- 001 )
: CVMC 302 305 LOADR ;
: CVMA 306 LOAD ;
( ----- 002 )
0 JMPi, PC 2 - TO lblboot 
PC TO lblnext PC TO lblcell 7 C,
PC TO lblxt 12 C,
PC TO lbldoes 18 C,
PC TO lblval 19 C,
( ----- 003 )
\ CVM native words
\ We implement the *absolute* bare bone set here, at the cost
\ of extreme inefficiency. The reason why we do that is that
\ the CVM generally runs on CPU that are obscenely fast, so
\ speed doesn't matter much. The other reason is that this
\ allows us to test the Forth "fallback" words properly,
\ something we wouldn't to otherwise.
CODE PC! 51 C, ;CODE CODE PC@ 52 C, ;CODE
CODE * 53 C, ;CODE CODE /MOD 54 C, ;CODE
CODE QUIT PC 55 C, 0 JMPi, PC 2 - TO lblmain
CODE ABORT 56 C, JMPi, ( to QUIT )
CODE EXIT 13 C, ;CODE CODE BYE 59 C,
CODE RCNT 57 C, ;CODE CODE SCNT 58 C, ;CODE
CODE (br) 30 C, ;CODE CODE (?br) 8 C, ;CODE
CODE (next) 9 C, ;CODE
CODE (b) 15 C, ;CODE CODE (n) 16 C, ;CODE
( ----- 004 )
CODE C@ 63 C, ;CODE CODE @ 64 C, ;CODE
CODE C! 66 C, ;CODE CODE ! 65 C, ;CODE
CODE NOT 38 C, ;CODE
CODE AND 39 C, ;CODE CODE OR 40 C, ;CODE CODE XOR 41 C, ;CODE
CODE + 28 C, ;CODE CODE - 29 C, ;CODE
CODE < 33 C, ;CODE
CODE R@ 60 C, ;CODE CODE R~ 26 C, ;CODE
CODE R> 61 C, ;CODE CODE >R 62 C, ;CODE
( ----- 005 )
CODE DUP 0 C, ;CODE CODE DROP 1 C, ;CODE
CODE ?DUP 14 C, ;CODE
CODE SWAP 4 C, ;CODE CODE OVER 5 C, ;CODE
CODE ROT 6 C, ;CODE 
CODE TICKS ;CODE
CODE EXECUTE 21 C,
( ----- 006 )
\ CVM "assembler"
: JMP(i), 17 C, L, ;
: JMPi, 11 C, L, ;
: CALLi, 10 C, L, ;
: i>, 2 C, L, ;
: (i)>, 3 C, L, ; 
( ----- 009 )
\ Common drivers
: (key?) 0 PC@ 1 ;
: _ ( n blk( -- ) SWAP ( blk( n )
  ( n ) L|M 3 PC! 3 PC! ( blkid )
  ( blk( ) L|M 3 PC! 3 PC! ( dest ) ;
: (blk@) 1 3 PC! ( read ) _ ;
: (blk!) 2 3 PC! ( write ) _ ;
: TX> 8 PC! ; : RX<? 8 PC@ DUP IF 8 PC@ SWAP THEN ;
( ----- 010 )
\ Grid drivers
: COLS $03 PC@ ; : LINES $04 PC@ ;
: CURSOR! ( new old -- )
    DROP COLS /MOD 6 PC! ( y ) 5 PC! ( x ) ;
: CELL! ( c pos -- ) 0 CURSOR! 0 PC! ;
: NEWLN ( ln -- ln ) 1+ DUP LINES = IF 1- 0 7 PC! THEN ;
