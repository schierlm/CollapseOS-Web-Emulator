;*************************************************************
;
; *** LIST *** & PRINT ***
;
; LIST HAS TWO FORMS:
; 'LIST(CR)' LISTS ALL SAVED LINES
; 'LIST #(CR)' START LIST AT THIS LINE #
; YOU CAN STOP THE LISTING BY CONTROL C KEY
;
; PRINT COMMAND IS 'PRINT ....;' OR 'PRINT ....(CR)'
; WHERE '....' IS A LIST OF EXPRESIONS, FORMATS, BACK-
; ARROWS, AND STRINGS.  THESE ITEMS ARE SEPERATED BY COMMAS.
;
; A FORMAT IS A POUND SIGN FOLLOWED BY A NUMBER.  IT CONTROLS
; THE NUMBER OF SPACES THE VALUE OF A EXPRESION IS GOING TO
; BE PRINTED.  IT STAYS EFFECTIVE FOR THE REST OF THE PRINT
; COMMAND UNLESS CHANGED BY ANOTHER FORMAT.  IF NO FORMAT IS
; SPECIFIED, 6 POSITIONS WILL BE USED.
;
; A STRING IS QUOTED IN A PAIR OF SINGLE QUOTES OR A PAIR OF
; DOUBLE QUOTES.
;
; A BACK-ARROW MEANS GENERATE A (CR) WITHOUT (LF)
;
; A (CRLF) IS GENERATED AFTER THE ENTIRE LIST HAS BEEN
; PRINTED OR IF THE LIST IS A NULL LIST.  HOWEVER IF THE LIST
; ENDED WITH A COMMA, NO (CRLF) IS GENERATED.
;*************************************************************

_LIST:
        CALL TSTNUM                     ;TEST IF THERE IS A #
        CALL ENDCHK                     ;IF NO # WE GET A 0
        CALL FNDLN                      ;FIND THIS OR NEXT LINE
LS1:
        JP C,RSTART                     ;C:PASSED TXTUNF
        CALL PRTLN                      ;PRINT THE LINE
        CALL CHKIO_NONBLOCK             ;STOP IF HIT CONTROL-C
        CALL FNDLP                      ;FIND NEXT LINE
        JR LS1                          ;AND LOOP BACK
_PRINT:
        LD C, 0x06                        ;C = # OF SPACES
        CALL RST08                         ;F NULL LIST & ";"
        .db 0x3B
        .db 5;PR2-$-1
        CALL CRLF                       ;GIVE CR-LF AND
        JR RUNSML                       ;CONTINUE SAME LINE
PR2:
        CALL RST08                         ;IF NULL LIST (CR)
        .db CR
        .db 5;PR0-$-1
        CALL CRLF                       ;ALSO GIVE CR-LF AND
        JR RUNNXL                       ;GO TO NEXT LINE
PR0:
        CALL RST08                         ;ELSE IS IT FORMAT?
        .db '#'
        .db 6;PR1-$-1
        CALL RST18                         ;YES, EVALUATE EXPR.
        LD C,L                          ;AND SAVE IT IN C
        JR PR3                          ;LOOK FOR MORE TO PRINT
PR1:
        CALL QTSTG                      ;OR IS IT A STRING?
        JR PR8                          ;IF NOT, MUST BE EXPR.
PR3:
        CALL RST08                         ;IF ",", GO FIND NEXT
        .db ','
        .db 5;PR6-$-1
        CALL FIN                        ;IN THE LIST.
        JR PR0                          ;LIST CONTINUES
PR6:
        CALL CRLF                       ;LIST ENDS
        CALL RST30
PR8:
        CALL RST18                         ;EVALUATE THE EXPR
        PUSH BC
        CALL PRTNUM                     ;PRINT THE VALUE
        POP BC
        JR PR3                          ;MORE TO PRINT?

.db 0,0,0,0  ; WHY DO WE NEED TO PAD HERE?
