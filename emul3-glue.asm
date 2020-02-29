.inc "blkdev.h"
.inc "fs.h"
.inc "err.h"
.inc "ascii.h"
.equ	RAMSTART	0x4000
.equ	USER_CODE	0x6200
.equ	STDIO_PORT	0x00
.equ	FS_DATA_PORT	0x01
.equ	FS_ADDR_PORT	0x02

	jp	init

; *** JUMP TABLE ***
	jp	strncmp
	jp	upcase
	jp	findchar
	jp	blkSelPtr
	jp	blkSel
	jp	blkSet
	jp	blkSeek
	jp	blkTell
	jp	blkGetB
	jp	blkPutB
	jp	fsFindFN
	jp	fsOpen
	jp	fsGetB
	jp	fsPutB
	jp	fsSetSize
	jp	fsOn
	jp	fsIter
	jp	fsAlloc
	jp	fsDel
	jp	fsHandle
	jp	printstr
	jp	printnstr
	jp	_blkGetB
	jp	_blkPutB
	jp	_blkSeek
	jp	_blkTell
	jp	printcrlf
	jp	stdioGetC
	jp	stdioPutC
	jp	stdioReadLine

.inc "core.asm"
.inc "kernel/str.asm"

.equ PAD_RAMSTART RAMSTART
.inc "kernel/sms/pad.asm"

.inc "kernel/sms/vdp.asm"
.equ	GRID_RAMSTART	PAD_RAMEND
.equ	GRID_COLS	VDP_COLS
.equ	GRID_ROWS	VDP_ROWS
.equ	GRID_SETCELL	vdpSetCell
.equ	GRID_GETC	padGetC
.inc "kernel/grid.asm"

.equ	BLOCKDEV_RAMSTART	GRID_RAMEND
.equ	BLOCKDEV_COUNT		10
.inc "kernel/blockdev.asm"
; List of devices
.dw	fsdevGetB, fsdevPutB
.dw	stdoutGetB, stdoutPutB
.dw	stdinGetB, stdinPutB
.dw	mmapGetB, mmapPutB
.dw     unsetZ, unsetZ
.dw     unsetZ, unsetZ
.dw     f2GetB, f2PutB
.dw     f3GetB, f3PutB
.dw     f4GetB, f4PutB
.dw     f5GetB, f5PutB


.equ	MMAP_START	0xe000
.inc "kernel/mmap.asm"

.equ	STDIO_RAMSTART	BLOCKDEV_RAMEND
.equ	STDIO_GETC	emulGetC
.equ	STDIO_PUTC	gridPutC
.inc "kernel/stdio.asm"

.equ	FS_RAMSTART	STDIO_RAMEND
.equ	FS_HANDLE_COUNT	6
.inc "kernel/fs.asm"

; *** BASIC ***

; RAM space used in different routines for short term processing.
.equ	SCRATCHPAD_SIZE	STDIO_BUFSIZE
.equ	SCRATCHPAD	FS_RAMEND
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
	di
	; setup stack
	ld	sp, 0xffff
	call	gridInit
	call	padInit
	call	vdpInit
	call	fsInit
	ld	a, 0	; select fsdev
	ld	de, BLOCKDEV_SEL
	call	blkSel
	call	fsOn
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
	jp	basPgmHook

emulGetC:
	call	gridGetC
	push	bc
	ld	c, a
	in	a, (STDIO_PORT)
	or	a
	jr	nz, .keep
	in	a, (STDIO_PORT)
	ld	c, a
.keep:
	ld	a, c
	pop	bc
	cp	a		; ensure Z
	ret


fsdevGetB:
	ld	a, e
	out	(FS_ADDR_PORT), a
	ld	a, h
	out	(FS_ADDR_PORT), a
	ld	a, l
	out	(FS_ADDR_PORT), a
	in	a, (FS_ADDR_PORT)
	or	a
	ret	nz
	in	a, (FS_DATA_PORT)
	cp	a		; ensure Z
	ret

fsdevPutB:
	push	af
	ld	a, e
	out	(FS_ADDR_PORT), a
	ld	a, h
	out	(FS_ADDR_PORT), a
	ld	a, l
	out	(FS_ADDR_PORT), a
	in	a, (FS_ADDR_PORT)
	cp	2		; only A > 1 means error
	jr	nc, .error	; A >= 2
	pop	af
	out	(FS_DATA_PORT), a
	cp	a		; ensure Z
	ret
.error:
	pop	af
	jp	unsetZ		; returns

.equ	STDOUT_HANDLE	FS_HANDLES

stdoutGetB:
	ld	ix, STDOUT_HANDLE
	jp	fsGetB

stdoutPutB:
	ld	ix, STDOUT_HANDLE
	jp	fsPutB

.equ	STDIN_HANDLE	FS_HANDLES+FS_HANDLE_SIZE

stdinGetB:
	ld	ix, STDIN_HANDLE
	jp	fsGetB

stdinPutB:
	ld	ix, STDIN_HANDLE
	jp	fsPutB

.equ	F2_HANDLE	STDIN_HANDLE+FS_HANDLE_SIZE

f2GetB:
	ld	ix, F2_HANDLE
	jp	fsGetB

f2PutB:
	ld	ix, F2_HANDLE
	jp	fsPutB

.equ	F3_HANDLE	F2_HANDLE+FS_HANDLE_SIZE

f3GetB:
	ld	ix, F3_HANDLE
	jp	fsGetB

f3PutB:
	ld	ix, F3_HANDLE
	jp	fsPutB

.equ	F4_HANDLE	F3_HANDLE+FS_HANDLE_SIZE

f4GetB:
	ld	ix, F4_HANDLE
	jp	fsGetB

f4PutB:
	ld	ix, F4_HANDLE
	jp	fsPutB

.equ	F5_HANDLE	F4_HANDLE+FS_HANDLE_SIZE

f5GetB:
	ld	ix, F5_HANDLE
	jp	fsGetB

f5PutB:
	ld	ix, F5_HANDLE
	jp	fsPutB

FNT_DATA:
.bin "fnt/7x7.bin"
