.inc "user.h"
.inc "err.h"
.inc "ascii.h"
.inc "blkdev.h"
.inc "fs.h"
jp	init

.inc "core.asm"
.inc "lib/util.asm"
.inc "lib/parse.asm"
.inc "oldshell/args.asm"
.equ	SHELL_RAMSTART	USER_RAMSTART
.equ	SHELL_EXTRA_CMD_COUNT	10
.inc "oldshell/main.asm"
.dw	blkBselCmd, blkSeekCmd, blkLoadCmd, blkSaveCmd
.dw	fsOnCmd, flsCmd, fnewCmd, fdelCmd, fopnCmd, exitCmd
.equ	SHELL_INITSP	SHELL_RAMEND
.inc "lib/ari.asm"
.inc "lib/fmt.asm"
.inc "oldshell/blkdev.asm"
.inc "oldshell/fs.asm"

exitCmd:
	.db	"exit", 0, 0, 0
	xor	a
	ld	sp, (SHELL_INITSP)
	ret

init:
	call	shellInit
	ld	(SHELL_INITSP), sp
	jp	shellLoop

USER_RAMSTART:
