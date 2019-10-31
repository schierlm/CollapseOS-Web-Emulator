;*************************************************************
;
;                 TINY BASIC FOR ZILOG Z80
;                       VERSION 2.0
;                     BY LI-CHEN WANG
;
;                  MODIFIED AND TRANSLATED
;                    TO INTEL MNEMONICS
;                     BY ROGER RAUSKOLB
;                      10 OCTOBER,1976
;
;                  MODIFIED AND TRANSLATED
;                    TO ZILOG MNEMONICS
;                      BY DOUG GABBARD
;                    www.retrodepot.net
;
;                   RELEASED TO THE PUBLIC
;                      10 OCTOBER,2017
;                  YEAH, 41 YEARS LATER....
;
;                         @COPYLEFT
;                   ALL WRONGS RESERVED
;
;*************************************************************
; This code is derived from the original 8080 Tiny Basic.
; It was first compiled in 8080 Mnemonics, then disassembled
; into Zilog Mnemonics.  And then checked against the original
; to ensure accuracy.  It was then partially enhanced with z80
; specific code. And once done, it was then modified to work
; with the G80-S Micro Computer. However, that portion of the
; code has been left out in order to make this code a little
; more portable.  There are only three routines that one needs
; to write, and specifing the serial port's I/O address, in
; order to make this version work with your own DIY computer.
; Those routines can be found at the end of the source code.
;
; I hope you find good use for this relic. However, I would
; ask that if you do find use for it, please put a reference
; to me in your work. And please, distribute freely.
;*************************************************************
;
;          MODIFIED FOR COLLAPSEOS AND ZASM COMPILER
;                     BY AGUSTIN GIMENEZ
;
;                     WORK ON PROGRESS
;
;                     USE AT YOUR WISH
;
;*************************************************************

.org	USER_CODE

.equ    _SPACE          0x020            ; Space
.equ    TAB             0x09             ; HORIZONTAL TAB
.equ    CTRLC           0x03             ; Control "C"
.equ    CTRLG           0x07             ; Control "G"
.equ    BKSP            0x08             ; Back space
.equ    LF              0x0A             ; Line feed
.equ    CS              0x0C             ; Clear screen
.equ    CR              0x0D             ; Carriage return
.equ    CTRLO           0x0F             ; Control "O"
.equ    CTRLQ           0x011            ; Control "Q"
.equ    CTRLR           0x012            ; Control "R"
.equ    CTRLS           0x013            ; Control "S"
.equ    CTRLU           0x015            ; Control "U"
.equ    ESC             0x01B            ; Escape
.equ    DEL             0x07F            ; Delete

.equ    STACK           0xFFFF          ; STACK
.equ    OCSW            0x8000          ;SWITCH FOR OUTPUT
.equ    CURRNT          OCSW+1          ;POINTS FOR OUTPUT
.equ    STKGOS          OCSW+3          ;SAVES SP IN 'GOSUB'
.equ    VARNXT          OCSW+5          ;TEMP STORAGE
.equ    STKINP          OCSW+7          ;SAVES SP IN 'INPUT'
.equ    LOPVAR          OCSW+9          ;'FOR' LOOP SAVE AREA
.equ    LOPINC          OCSW+11         ;INCREMENT
.equ    LOPLMT          OCSW+13         ;LIMIT
.equ    LOPLN           OCSW+15         ;LINE NUMBER
.equ    LOPPT           OCSW+17         ;TEXT POINTER
.equ    RANPNT          OCSW+19         ;RANDOM NUMBER POINTER
.equ    TXTUNF          OCSW+21         ;->UNFILLED TEXT AREA
.equ    TXTBGN          OCSW+23         ;TEXT SAVE AREA BEGINS

.equ    TXTEND          0xFF00          ;TEXT SAVE AREA ENDS

.equ	VARBGN		0xFF00
.equ	BUFFER		VARBGN+55
.equ	BUFEND		BUFFER+64
.equ	STKLMT		BUFEND+1
.equ    LSTROM		0x7FF0

;*************************************************************
; *** ZERO PAGE SUBROUTINES ***
;
; THE Z80 INSTRUCTION SET ALLOWS FOR 8 ROUTINES IN LOW MEMORY
; THAT MAY BE CALLED BY RST 00H, 08H, 10H, 18H, 20H, 28H, 30H,
; AND 38H.  THIS IS A ONE BYTE INSTRUCTION, AND IS FUNCTIONALLY
; SIMILAR TO THE THREE BYTE INSTRUCTION 'CALL XXXX'. TINY BASIC
; WILL USE THE RST INSTRUCTION FOR THE 7 MOST FREQUENTLY USED
; SUBROUTINES. TWO OTHER SUBROUTINES (CRLF & TSTNUM) ARE ALSO
; IN THIS SECTION. THEY CAN BE REACHED WITH 'CALL'.
;*************************************************************
;
; IN ORDER TO MAKE THIS CODE RELOCATABLE THE RST FUNCTIONS
; HAD TO BE CALLED AS REGULAR ROUTINES
;
;*************************************************************

;DWA     MACRO WHERE                    ;Workaround applied on command table to avoid macros
;        DB   (WHERE SHR 8) + 128
;        DB   WHERE & 0FFH
;        ENDM

START:
	LD A,0x01
	LD (OCSW),A
        LD SP,STACK                     ;*** COLD START ***
        LD A,0x0FF
        JP INIT

RST08:  EX (SP),HL                      ;*** TSTC OR CALL RST08 ***
        CALL RST28                      ;IGNORE BLANKS AND
        CP (HL)                         ;TEST CHARACTER
        JP TC1                          ;REST OF THIS IS AT TC1

CRLF:
        LD A,CR                         ;*** CRLF ***

RST10:  PUSH AF                         ;*** OUTC OR CALL RST10 ***
        LD A,(OCSW)                     ;PRINT CHARACTER ONLY
        OR A                            ;IF OCSW SWITCH IS ON
        JP OUTC                         ;REST OF THIS AT OUTC

RST18:  CALL EXPR2                      ;*** EXPR OR CALL RST18 ***
        PUSH HL                         ;EVALUATE AN EXPRESSION
        JP EXPR1                        ;REST OF IT AT EXPR1

RST20:  LD A,H                          ;*** COMP OR CALL RST20 ***
        CP D                            ;COMPARE HL WITH DE
        RET NZ                          ;RETURN CORRECT C AND
        LD A,L                          ;Z FLAGS
        CP E                            ;BUT OLD A IS LOST
        RET

SS1:
RST28:  LD A,(DE)                       ;*** IGNBLK/CALL RST28 ***
        CP 0x20                         ;IGNORE BLANKS
        RET NZ                          ;IN TEXT (WHERE DE->)
        INC DE                          ;AND RETURN THE FIRST
        JP SS1                          ;NON-BLANK CHAR. IN A

RST30:  POP AF                          ;*** FINISH/CALL RST30 ***
        CALL FIN                        ;CHECK END OF COMMAND
        JP QWHAT                        ;PRINT "WHAT?" IF WRONG

RST38:  CALL RST28                      ;*** TSTV OR CALL RST38 ***
        SUB 0x40                        ;TEST VARIABLES
        RET C                           ;C:NOT A VARIABLE
        JR NZ,TV1                       ;NOT "@" ARRAY
        INC DE                          ;IT IS THE "@" ARRAY
        CALL PARN                       ;@ SHOULD BE FOLLOWED
        ADD HL,HL                       ;BY (EXPR) AS ITS INDEX
        JR C,QHOW                       ;IS INDEX TOO BIG?
        PUSH DE                         ;WILL IT OVERWRITE
        EX DE,HL                        ;TEXT?
        CALL SIZE                       ;FIND SIZE OF FREE
        CALL RST20                        ;AND CHECK THAT
        JP C,ASORRY                     ;IF SO, SAY "SORRY"
        LD HL,VARBGN                    ;IF NOT GET ADDRESS
        CALL SUBDE                      ;OF @(EXPR) AND PUT IT
        POP DE                          ;IN HL
        RET                             ;C FLAG IS CLEARED

TV1:	CP 0x20
	JR C, TV2
	SUB 0x20
TV2:
        CP 0x1B                         ;NOT @, IS IT A TO Z?
        CCF                             ;IF NOT RETURN C FLAG
        RET C
        INC DE                          ;IF A THROUGH Z
        LD HL,VARBGN                    ;COMPUTE ADDRESS OF
        RLCA                            ;THAT VARIABLE
        ADD A,L                         ;AND RETURN IT IN HL
        LD L,A                          ;WITH C FLAG CLEARED
        LD A,0x00
        ADC A,H
        LD H,A
        RET

TC1:
        INC HL                          ;COMPARE THE BYTE THAT
        JR Z,TC2                        ;FOLLOWS THE RST INST.
        PUSH BC                         ;WITH THE TEXT (DE->)
        LD C,(HL)                       ;IF NOT =, ADD THE 2ND
        LD B,0x00                       ;BYTE THAT FOLLOWS THE
        ADD HL,BC                       ;RST TO THE OLD PC
        POP BC                          ;I.E., DO A RELATIVE
        DEC DE                          ;JUMP IF NOT =

TC2:
        INC DE                          ;IF =, SKIP THOSE BYTES
        INC HL                          ;AND CONTINUE
        EX (SP),HL
        RET

TSTNUM:
        LD HL,0x0000                    ;*** TSTNUM ***
        LD B,H                          ;TEST IF THE TEXT IS
        CALL RST28                        ;A NUMBER

TN1:
        CP 0x30                         ;IF NOT, RETURN 0 IN
        RET C                           ;B AND HL
        CP 0x3A                         ;IF NUMBERS, CONVERT
        RET NC                          ;TO BINARY IN HL AND
        LD A,0xF0                       ;SET B TO # OF DIGITS
        AND H                           ;IF H>255, THERE IS NO
        JR NZ,QHOW                      ;ROOM FOR NEXT DIGIT
        INC B                           ;B COUNTS # OF DIGITS
        PUSH BC
        LD B,H                          ;HL=10*HL+(NEW DIGIT)
        LD C,L
        ADD HL,HL                       ;WHERE 10* IS DONE BY
        ADD HL,HL                       ;SHIFT AND ADD
        ADD HL,BC
        ADD HL,HL
        LD A,(DE)                       ;AND (DIGIT) IS FROM
        INC DE                          ;STRIPPING THE ASCII
        AND 0x0F                        ;CODE
        ADD A,L
        LD L,A
        LD A,0x00
        ADC A,H
        LD H,A
        POP BC
        LD A,(DE)                       ;DO THIS DIGIT AFTER
        JP P,TN1                        ;DIGIT. S SAYS OVERFLOW

QHOW:
        PUSH DE                         ;*** ERROR "HOW?" ***
AHOW:
        LD DE,HOW
        JP ERROR_ROUTINE


HOW:    .db "HOW?",CR
OK:     .db "OK",CR
WHAT:   .db "WHAT?",CR
SORRY:  .db "SORRY",CR
