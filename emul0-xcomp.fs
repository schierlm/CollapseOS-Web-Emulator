( based on collapseos/emul/xcomp.fs )
0xfe00 CONSTANT RAMSTART
0xff00 CONSTANT RS_ADDR
0xfffa CONSTANT PS_ADDR

VARIABLE ORG
VARIABLE BIN( 0 BIN( !
: SPLITB 256 /MOD SWAP ;
: PC H@ ORG @ - BIN( @ + ;
: A, C, ; : A,, SPLITB A, A, ;
: CODE ;

262 LOAD  ( xcomp #=263 #=265 )

: JSCODE ( native word pointing to byte index )
    XCON
    (entry)
    0 C, ( 0 == native )
    C, ( index )
    XCOFF
;

270 LOAD  ( xcomp overrides #=270 )

H@ ORG !

( start here for pass 1 bootstrap ###P1### )

0 A,, ( 0x00 = fill LATEST )
0 A,, ( 0x02 = fill (oflw) )
0 A,, ( 0x04 = fill BOOT )
0 A,, ( 0x06 = fill (uflw) )
0 A,, 0 A,, 0 A,, 0 A,,

0 A,, ( 0x10 )
0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,,

0 A,, ( 0x20 )
0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,,

0 A,, ( 0x30 )
0 A,, 0 A,, 0 A,, 0 A,, 0 A,

( BOOT DICT starting at 0x3b )

'E' A, 'X' A, 'I' A, 'T' A,
0 A,, ( prev )
4 A,
H@ XCURRENT !        ( set current tip of dict, 0x42 )
    0x0 A,           ( 0x0 = native )
    0x0 A,           ( index )

( more native words of stable ABI )
0 A,, 0 A,, 0 A,, 0 A,,
1 JSCODE (br)        ( 0x53 )
0 A,, 0 A,, 0 A,, 0 A,, 0 A,,
2 JSCODE (?br)       ( 0x67 )
0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,,
3 JSCODE (loop)      ( 0x77 )
0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,,
0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,
4 JSCODE 2>R          ( 0xa8 )
0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,,
5 JSCODE (n)
0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,, 0 A,
6 JSCODE (s)

( end of stable ABI )
7 JSCODE >R
8 JSCODE R>
9 JSCODE 2R>
10 JSCODE EXECUTE
11 JSCODE ROT
12 JSCODE DUP
13 JSCODE ?DUP
14 JSCODE DROP
15 JSCODE SWAP
16 JSCODE OVER
17 JSCODE 2DROP
18 JSCODE 2DUP
19 JSCODE S0
20 JSCODE 'S
21 JSCODE NOT
22 JSCODE AND
23 JSCODE OR
23 JSCODE XOR
25 JSCODE +
26 JSCODE -
27 JSCODE *
28 JSCODE RSHIFT
29 JSCODE LSHIFT
30 JSCODE /MOD
31 JSCODE !
32 JSCODE @
33 JSCODE C!
34 JSCODE C@
35 JSCODE PC!
36 JSCODE PC@
37 JSCODE I
38 JSCODE I'
39 JSCODE J
40 JSCODE BYE
41 JSCODE (resSP)
42 JSCODE (resRS)
43 JSCODE 1+
44 JSCODE 1-
45 JSCODE S=
46 JSCODE CMP
47 JSCODE _find
48 JSCODE PICK
49 JSCODE (roll)

: 0 0x00 ;
: 1 0x01 ;
: -1 0xffff ;
: 2+ 1+ 1+ ;
: 2- 1- 1- ;

353 LOAD  ( xcomp core low #=3531 #=354 #=355 #=356 )
( #=357 #=358 #=359 #=360 #=361 #=362 #=363 #=364 #=365 )
( #=366 #=367 #=369 #=370 #=371 #=372 #=373 #=374 #=376 )
( #=377 #=378 )

: (oflw) LIT" stack overflow" ERR ;
XCURRENT @ _xapply ORG @ 0x02 ( stable ABI oflw ) + !

: _currdisk [ RAMSTART 0x70 + LITN ] ;
: (emit) 0 PC! ;
: (key) BEGIN 0 PC@ 0 = UNTIL 0 PC@ ;
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
: COLS 80 ; : LINES 25 ;
: AT-XY 6 PC! ( y ) 5 PC! ( x ) ;

380 LOAD  ( xcomp core high #=381 #=382 #=383 #=384 #=385 )
( #=386 #=387 #=388 #=389 #=390 #=391 #=392 #=393 #=394 #=396 )
( #=397 #=398 #=399 #=400 )

(entry) _
( Update LATEST )
PC ORG @ !
," CURRENT @ HERE ! "
," BLK$ 0 SELDISK "
," ' EFS@ BLK@* ! "
," ' EFS! BLK!* ! "
EOT,
ORG @ 256 /MOD 2 PC! 2 PC!
H@ 256 /MOD 2 PC! 2 PC!
