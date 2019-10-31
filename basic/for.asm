;*************************************************************
;
; *** FOR *** & NEXT ***
;
; 'FOR' HAS TWO FORMS:
; 'FOR VAR=EXP1 TO EXP2 STEP EXP3' AND 'FOR VAR=EXP1 TO EXP2'
; THE SECOND FORM MEANS THE SAME THING AS THE FIRST FORM WITH
; EXP3=1.  (I.E., WITH A STEP OF +1.)
; TBI WILL FIND THE VARIABLE VAR, AND SET ITS VALUE TO THE
; CURRENT VALUE OF EXP1.  IT ALSO EVALUATES EXP2 AND EXP3
; AND SAVE ALL THESE TOGETHER WITH THE TEXT POINTER ETC. IN
; THE 'FOR' SAVE AREA, WHICH CONSISTS OF 'LOPVAR', 'LOPINC',
; 'LOPLMT', 'LOPLN', AND 'LOPPT'.  IF THERE IS ALREADY SOME-
; THING IN THE SAVE AREA (THIS IS INDICATED BY A NON-ZERO
; 'LOPVAR'), THEN THE OLD SAVE AREA IS SAVED IN THE STACK
; BEFORE THE NEW ONE OVERWRITES IT.
; TBI WILL THEN DIG IN THE STACK AND FIND OUT IF THIS SAME
; VARIABLE WAS USED IN ANOTHER CURRENTLY ACTIVE 'FOR' LOOP.
; IF THAT IS THE CASE, THEN THE OLD 'FOR' LOOP IS DEACTIVATED.
; (PURGED FROM THE STACK..)
;
; 'NEXT VAR' SERVES AS THE LOGICAL (NOT NECESSARILLY PHYSICAL)
; END OF THE 'FOR' LOOP.  THE CONTROL VARIABLE VAR. IS CHECKED
; WITH THE 'LOPVAR'.  IF THEY ARE NOT THE SAME, TBI DIGS IN
; THE STACK TO FIND THE RIGHT ONE AND PURGES ALL THOSE THAT
; DID NOT MATCH.  EITHER WAY, TBI THEN ADDS THE 'STEP' TO
; THAT VARIABLE AND CHECK THE RESULT WITH THE LIMIT.  IF IT
; IS WITHIN THE LIMIT, CONTROL LOOPS BACK TO THE COMMAND
; FOLLOWING THE 'FOR'.  IF OUTSIDE THE LIMIT, THE SAVE AREA
; IS PURGED AND EXECUTION CONTINUES.
;*************************************************************

FOR:
        CALL PUSHA                      ;SAVE THE OLD SAVE AREA
        CALL SETVAL                     ;SET THE CONTROL VAR.
        DEC HL                          ;HL IS ITS ADDRESS
        LD (LOPVAR),HL                  ;SAVE THAT
        LD HL,TAB5-1                    ;USE 'EXEC' TO LOOK
        JP EXEC                         ;FOR THE WORK 'TO'
FR1:
        CALL RST18                         ;EVALUATE THE LIMITE
        LD (LOPLMT),HL                  ;SAVE THAT
        LD HL,TAB6-1                    ;USE 'EXEC' TO LOOK
        JP EXEC                         ;FOR THE WORD 'STEP'
FR2:
        CALL RST18                         ;FOUND IT, GET STEP
        JR FR4
FR3:
        LD HL, 0x0001                     ;NOT FOUND, SET TO 1
FR4:
        LD (LOPINC),HL                  ;SAVE THAT TOO
FR5:
        LD HL,(CURRNT)                  ;SAVE CURRENT LINE #
        LD (LOPLN),HL
        EX DE,HL                        ;AND TEXT POINTER
        LD (LOPPT),HL
        LD BC, 0x0A                       ;DIG INTO STACK TO
        LD HL,(LOPVAR)                  ;FIND 'LOPVAR'
        EX DE,HL
        LD H,B
        LD L,B                          ;HL=0 NOW
        ADD HL,SP                       ;HERE IS THE STACK
        .db 0x3E                         ;DISASSEMBLY SAID "ld a,09h"
FR7:
        ADD HL,BC                       ;EACH LEVEL IS 10 DEEP - DIS = 09
        LD A,(HL)                       ;GET THAT OLD 'LOPVAR'
        INC HL
        OR (HL)
        JR Z,FR8                        ;0 SAYS NO MORE IN IT
        LD A,(HL)
        DEC HL
        CP D                            ;SAME AS THIS ONE?
        JR NZ,FR7
        LD A,(HL)                       ;THE OTHER HALF?
        CP E
        JR NZ,FR7
        EX DE,HL                        ;YES, FOUND ONE
        LD HL, 0x0000
        ADD HL,SP                       ;TRY TO MOVE SP
        LD B,H
        LD C,L
        LD HL, 0x000A
        ADD HL,DE
        CALL MVDOWN                     ;AND PURGE 10 WORDS
        LD SP,HL                        ;IN THE STACK
FR8:
        LD HL,(LOPPT)                   ;JOB DONE, RESTORE DE
        EX DE,HL
        CALL RST30                         ;AND CONTINUE
;
NEXT:
        CALL RST38                         ;GET ADDRESS OF VAR.
        JP C,QWHAT                      ;NO VARIABLE, "WHAT?"
        LD (VARNXT),HL                  ;YES, SAVE IT
NX0:
        PUSH DE                         ;SAVE TEXT POINTER
        EX DE,HL
        LD HL,(LOPVAR)                  ;GET VAR. IN 'FOR'
        LD A,H
        OR L                            ;0 SAYS NEVER HAD ONE
        JP Z,AWHAT                      ;SO WE ASK: "WHAT?"
        CALL RST20                         ;ELSE WE CHECK THEM
        JR Z,NX3                        ;OK, THEY AGREE
        POP DE                          ;NO, LET'S SEE
        CALL POPA                       ;PURGE CURRENT LOOP
        LD HL,(VARNXT)                  ;AND POP ONE LEVEL
        JR NX0                          ;GO CHECK AGAIN
NX3:
        LD E,(HL)                       ;COME HERE WHEN AGREED
        INC HL
        LD D,(HL)                       ;DE=VALUE OF VAR.
        LD HL,(LOPINC)
        PUSH HL
        LD A,H
        XOR D
        LD A,D
        ADD HL,DE                       ;ADD ONE STEP
        JP M,NX4
        XOR H
        JP M,NX5
NX4:
        EX DE,HL
        LD HL,(LOPVAR)                  ;PUT IT BACK
        LD (HL),E
        INC HL
        LD (HL),D
        LD HL,(LOPLMT)                  ;HL->LIMIT
        POP AF                          ;OLD HL
        OR A
        JP P,NX1                        ;STEP > 0
        EX DE,HL                        ;STEP < 0
NX1:
        CALL CKHLDE                     ;COMPARE WITH LIMIT
        POP DE                          ;RESTORE TEXT POINTER
        JR C,NX2                        ;OUTSIDE LIMIT
        LD HL,(LOPLN)                   ;WITHIN LIMIT, GO
        LD (CURRNT),HL                  ;BACK TO THE SAVED
        LD HL,(LOPPT)                   ;'CURRNT' AND TEXT
        EX DE,HL                        ;POINTER
        CALL RST30
NX5:
        POP HL
        POP DE
NX2:
        CALL POPA                       ;PURGE THIS LOOP
        CALL RST30
