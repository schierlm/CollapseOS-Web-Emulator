
;-------------------------------------------------------------------------------
;///////////////////////////////////////////////////////////////////////////////
;-------------------------------------------------------------------------------
;COMPUTER SPECIFIC ROUTINES.
;-------------------------------------------------------------------------------
SERIAL_INIT:

        ; This routine is for initializing your serial port.


        RET
;-------------------------------------------------------------------------------
TX_RDY:

        ; This routine sends a character stored in A

        JP stdioPutC

;-------------------------------------------------------------------------------
RX_RDY:

        ; This routine is for checkif if a character is available over
        ; serial. If a character is available, it returns to the calling
        ; function with the character in 'A' and the Z-flag reset.
        ; However, if a character is not available, it returns with the
        ; Z-flag set.

	CALL stdioGetC
	JP Z, RX_CHAR
	CP A			; ensure Z
        RET

RX_CHAR:
	CP 0x0A
	JP NZ, RX_NOSWAP1
	LD A, 0x0D
RX_NOSWAP1:
	CP 0x08
	JP NZ, RX_NOSWAP2
	LD A, 0x7F
RX_NOSWAP2:
	JP unsetZ


	; same, but may not block if no character is available

RX_RDY_NONBLOCK:
	CP A
	RET

;-------------------------------------------------------------------------------
;///////////////////////////////////////////////////////////////////////////////
;-------------------------------------------------------------------------------

;LSTROM:                                 ;ALL ABOVE CAN BE ROM
;                                        ;HERE DOWN MUST BE RAM
;        .org  0x8000
;        .org  0xFF00
;
;VARBGN: .fill   55                         ;VARIABLE @(0)
;BUFFER: .fill   64                         ;INPUT BUFFER
;BUFEND: .fill   1                          ;BUFFER ENDS
;STKLMT: .fill   1                          ;TOP LIMIT FOR STACK
