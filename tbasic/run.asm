;*************************************************************
;
; WHAT FOLLOWS IS THE CODE TO EXECUTE DIRECT AND STATEMENT
; COMMANDS.  CONTROL IS TRANSFERED TO THESE POINTS VIA THE
; COMMAND TABLE LOOKUP CODE OF 'DIRECT' AND 'EXEC' IN LAST
; SECTION.  AFTER THE COMMAND IS EXECUTED, CONTROL IS
; TRANSFERED TO OTHERS SECTIONS AS FOLLOWS:
;
; FOR 'LIST', 'NEW', AND 'STOP': GO BACK TO 'RSTART'
; FOR 'RUN': GO EXECUTE THE FIRST STORED LINE IF ANY, ELSE
; GO BACK TO 'RSTART'.
; FOR 'GOTO' AND 'GOSUB': GO EXECUTE THE TARGET LINE.
; FOR 'RETURN' AND 'NEXT': GO BACK TO SAVED RETURN LINE.
; FOR ALL OTHERS: IF 'CURRENT' -> 0, GO TO 'RSTART', ELSE
; GO EXECUTE NEXT COMMAND.  (THIS IS DONE IN 'FINISH'.)
;*************************************************************
;
; *** NEW *** STOP *** RUN (& FRIENDS) *** & GOTO ***
;
; 'NEW(CR)' SETS 'TXTUNF' TO POINT TO 'TXTBGN'
;
; 'STOP(CR)' GOES BACK TO 'RSTART'
;
; 'RUN(CR)' FINDS THE FIRST STORED LINE, STORE ITS ADDRESS (IN
; 'CURRENT'), AND START EXECUTE IT.  NOTE THAT ONLY THOSE
; COMMANDS IN TAB2 ARE LEGAL FOR STORED PROGRAM.
;
; THERE ARE 3 MORE ENTRIES IN 'RUN':
; 'RUNNXL' FINDS NEXT LINE, STORES ITS ADDR. AND EXECUTES IT.
; 'RUNTSL' STORES THE ADDRESS OF THIS LINE AND EXECUTES IT.
; 'RUNSML' CONTINUES THE EXECUTION ON SAME LINE.
;
; 'GOTO EXPR(CR)' EVALUATES THE EXPRESSION, FIND THE TARGET
; LINE, AND JUMP TO 'RUNTSL' TO DO IT.
;*************************************************************

NEW:
        CALL ENDCHK                     ;*** NEW(CR) ***
        LD HL,TXTBGN
        LD (TXTUNF),HL
STOP:
        CALL ENDCHK                     ;*** STOP(CR) ***
        JP RSTART
RUN:
        CALL ENDCHK                     ;*** RUN(CR) ***
        LD DE,TXTBGN                    ;FIRST SAVED LINE
RUNNXL:
        LD HL,0x00                       ;*** RUNNXL ***
        CALL FNDLP                      ;FIND WHATEVER LINE #
        JP C,RSTART                     ;C:PASSED TXTUNF, QUIT
RUNTSL:
        EX DE,HL                        ;*** RUNTSL ***
        LD (CURRNT),HL                  ;SET 'CURRENT'->LINE #
        EX DE,HL
        INC DE                          ;BUMP PASS LINE #
        INC DE
RUNSML:
        CALL CHKIO_NONBLOCK             ;*** RUNSML ***
        LD HL,TAB2-1                    ;FIND COMMAND IN TAB2
        JP EXEC                         ;AND EXECUTE IT
GOTO:
        CALL RST18                         ;*** GOTO EXPR ***
        PUSH DE                         ;SAVE FOR ERROR ROUTINE
        CALL ENDCHK                     ;MUST FIND A CR
        CALL FNDLN                      ;FIND THE TARGET LINE
        JP NZ,AHOW                      ;NO SUCH LINE #
        POP AF                          ;CLEAR THE PUSH DE
        JR RUNTSL                       ;GO DO IT
