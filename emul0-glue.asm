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

.equ	BLOCKDEV_RAMSTART	RAMSTART
.equ	BLOCKDEV_COUNT		3
.inc "kernel/blockdev.asm"
; List of devices
.dw	fsdevGetB, fsdevPutB
.dw	stdoutGetB, stdoutPutB
.dw	stdinGetB, stdinPutB


.equ	STDIO_RAMSTART	BLOCKDEV_RAMEND
.equ	STDIO_GETC	emulGetC
.equ	STDIO_PUTC	emulPutC
.inc "kernel/stdio.asm"

.equ	FS_RAMSTART	STDIO_RAMEND
.equ	FS_HANDLE_COUNT	2
.inc "kernel/fs.asm"

.equ	PGM_HANDLE	FS_RAMEND

prompt:
	.db	"# ", 0

init:
	di
	ld	sp, 0xffff
.mainloop:
	call	fsInit
	ld	a, 0
	ld	de, BLOCKDEV_SEL
	call	blkSel
	call	fsOn
	ld	hl, prompt
	call	printstr
	call	stdioReadLine
	call	printcrlf
	ld	a, (hl)
	or	a
	jr	z, .mainloop
	push hl \ pop de
	ld	a, ' '
	call	findchar
	jr	nz, .noargs
	xor	a
	ld	(hl), a
	inc	hl
.noargs:
	ex	de, hl
	call	fsFindFN
	jr	nz, .mainloop
	push	de
	ld	ix, PGM_HANDLE
	call	fsOpen
	ld	hl, 0
	ld	de, USER_CODE
.copyloop:
	call	fsGetB
	ld	(de), a
	inc	hl
	inc	de
	jr	z, .copyloop
	pop	hl
	call	USER_CODE
	jp .mainloop

emulGetC:
	in	a, (STDIO_PORT)
	or	a
	jr	nz, emulGetC
	in	a, (STDIO_PORT)
	cp	a		; ensure Z
	ret

emulPutC:
	out	(STDIO_PORT), a
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
