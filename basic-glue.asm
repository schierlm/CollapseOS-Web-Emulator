; *** Requirements ***
; printstr
; printcrlf
; stdioReadLine
; strncmp
;
.inc "user.h"
.inc "err.h"
.inc "fs.h"
.inc "ascii.h"

	jp	init

; RAM space used in different routines for short term processing.
.equ	SCRATCHPAD_SIZE	0x20
.equ	SCRATCHPAD	USER_RAMSTART

.inc "core.asm"
.inc "lib/util.asm"
.inc "lib/ari.asm"
.inc "lib/parse.asm"
.inc "lib/fmt.asm"
.equ	EXPR_PARSE	parseLiteralOrVar
.inc "lib/expr.asm"
.inc "basic/util.asm"
.inc "basic/parse.asm"
.inc "basic/tok.asm"
.equ	VAR_RAMSTART	SCRATCHPAD+SCRATCHPAD_SIZE
.inc "basic/var.asm"
.equ	BUF_RAMSTART	VAR_RAMEND
.inc "basic/buf.asm"
.equ	BFS_RAMSTART	BUF_RAMEND
.inc "basic/fs.asm"
.inc "basic/blk.asm"
.equ	BAS_RAMSTART	BFS_RAMEND
.inc "basic/main.asm"

init:
	call	basInit
	ld	hl, basFindCmdExtra
	ld	(BAS_FINDHOOK), hl
	jp	basStart

basFindCmdExtra:
	ld	hl, basFSCmds
	call	basFindCmd
	ret	z
	ld	hl, basBLKCmds
	call	basFindCmd
	ret	z
	ld	hl, basBYECmd
	jp	basFindCmd

basBYECmd:
	.db	"bye", 0
	.dw	basBYE
	.db	0xff		; end of table

basBYE:
	; To quit the loop, let's return the stack to its initial value and
	; then return.
	xor	a
	ld	sp, (BAS_INITSP)
	pop	ix
	ret

USER_RAMSTART:
