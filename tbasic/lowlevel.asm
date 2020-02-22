;*************************************************************
;
; *** IN *** & OUT *** & PEEK *** & POKE *** & SYS ***
;
;*************************************************************

SYS:
	CALL RST18
	CALL callHL
	JP RUNNXL
callHL:
	JP (HL)

POKE:
	CALL RST18
	PUSH HL
	INC DE        ; skip comma
	CALL RST18
	LD A, L
	POP HL
	LD (HL), A
	JP RUNNXL

OUT:
	CALL RST18
	PUSH HL
	INC DE        ; skip comma
	CALL RST18
	LD A, L
	POP HL
	LD C, L
	OUT (C), A
	JP RUNNXL

IN:
        CALL PARN
 	LD C, L
	IN L, (C)
        LD H, 0
        RET

PEEK:
	CALL PARN
	LD L, (HL)
	LD H, 0
        RET
