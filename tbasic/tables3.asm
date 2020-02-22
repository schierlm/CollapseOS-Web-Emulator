;TAB2 continued
        .dw DEFLT+0x8000
TAB4:                                   ;FUNCTIONS
        .db "RND"
        .dw RND+0x8000
        .db "ABS"
        .dw ABS+0x8000
        .db "SIZE"
        .dw SIZE+0x8000
	.db "PEEK"
	.dw PEEK+0x8000
	.db "IN"
	.dw IN+0x8000
        .dw XP40+0x8000
TAB5:                                   ;"TO" IN "FOR"
        .db "TO"
        .dw FR1+0x8000
        .dw QWHAT+0x8000
TAB6:                                   ;"STEP" IN "FOR"
        .db "STEP"
        .dw FR2+0x8000
        .dw FR3+0x8000
TAB8:                                   ;RELATION OPERATORS
        .db ">="
        .dw XP11+0x8000
        .db '#'
        .dw XP12+0x8000
        .db '>'
        .dw XP13+0x8000
        .db '='
        .dw XP15+0x8000
        .db "<="
        .dw XP14+0x8000
        .db '<'
        .dw XP16+0x8000
        .dw XP17+0x8000
	.db 0x00

DIRECT: LD HL,TAB1-1                    ;*** DIRECT ***
EXEC:                                   ;*** EXEC ***
EX0:    CALL RST28                         ;IGNORE LEADING BLANKS
        PUSH DE                         ;SAVE POINTER
EX1:
        LD A,(DE)                       ;IF FOUND '.' IN STRING
	CP 0x61                         ; LOWERCASE 'a'
	JP C, UCOK
	CP 0x7B                         ; LOWERCASE 'z' + 1
	JP NC, UCOK
	SUB 0x20
UCOK:
        INC DE                          ;BEFORE ANY MISMATCH
        CP 0x23                          ;WE DECLARE A MATCH
        JR Z,EX3
        INC HL                          ;HL->TABLE
        CP (HL)                         ;IF MATCH, TEST NEXT

        JR Z,EX1
        LD A,0x7F                        ;ELSE SEE IF BIT 7
        DEC DE                          ;OF TABLE IS SET, WHICH

        CALL CKJ                        ;IS THE JUMP ADDR. (HI)
        JR Z,EX5                        ;Z:YES, MATCHED
EX2:
        INC HL                          ;NC:NO, FIND JUMP ADDR.
	CALL CKJ
	JR NZ,EX2
        INC HL                          ;BUMP TO NEXT TAB. ITEM
        POP DE                          ;RESTORE STRING POINTER
        JR EX0                          ;TEST AGAINST NEXT ITEM
EX3:
        LD A, 0x7F                      ;PARTIAL MATCH, FIND
EX4:
        INC HL                          ;JUMP ADDR., WHICH IS
	CALL CKJ			;FLAGGED BY BIT 7
        JR NZ,EX4
EX5:
        PUSH BC                         ;STORE BC (WE NEED B FOR ZASM WORKAROUND)
        LD B, (HL)                      ;LOAD HL WITH THE JUMP
        INC HL                          ;ADDRESS FROM THE TABLE
        LD A, (HL)                      ;MODIFIED TO AVOID BYTE SWAP (ZASM WORKAROUND)
        AND 0x7F
        LD H, A
        LD L, B
        POP BC                          ;CLEAN UP THE GABAGE
        POP AF                          ;CLEAN UP THE GABAGE
        JP (HL)                         ;AND WE GO DO IT

CKJ:					;CHECK FOR JUMP ADDRESS FLAGGED BY BIT 7
	PUSH HL                         ;OF SECOND BYTE (WORKAROUND FOR ZASM)
        CP (HL)
	JR C,CKJ_Y                      ;C:YES, MATCHED
        INC HL
	CP (HL)
	JR NC,CKJ_N			;PATTERNS TO CHECK (NOT IN LINE WITH CODE)
        INC HL 				; X  -> YES
	CP (HL)				; xx -> NO
	JR NC,CKJ_Y			; xXx -> YES
        INC HL 				; xXXx -> NO
	CP (HL)				; xXXXx -> YES
	JR NC,CKJ_N			; xXXXX -> NO
        INC HL 				; (WE CAN ASSUME NO MORE THAN 4 CONSECUTIVE
	CP (HL)				; FLAGGED BYTES)
	JR NC,CKJ_Y
CKJ_N:
	POP HL
	JP unsetZ
CKJ_Y:
        POP HL
	CP A				;SET Z FLAG
	RET
