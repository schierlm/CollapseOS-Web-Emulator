; zmake - based on zasm
;
; Reads input from FOO/glue.asm, assemble the binary in two passes and
; spit the result into FOO. FOO is deleted if it exists, and recreated
; with maximum block count.
;
; *** Requirements ***
; strncmp
; addDE
; addHL
; upcase
; unsetZ
; intoDE
; intoHL
; writeHLinDE
; findchar
; parseHex
; parseHexPair
; blkSel
; blkSet
; fsFindFN
; fsOpen
; fsGetB
; cpHLDE
; parseArgs
; _blkGetB
; _blkPutB
; _blkSeek
; _blkTell
; printstr
; FS_HANDLE_SIZE
; BLOCKDEV_SIZE
;
; fsAlloc
; fdelRaw
; fopnRaw


.inc "user.h"

; *** Overridable consts ***
; NOTE: These limits below are designed to be *just* enough for zasm to assemble
; itself. Considering that this app is Collapse OS' biggest app, it's safe to
; assume that it will be enough for many many use cases. If you need to compile
; apps with lots of big symbols, you'll need to adjust these.
; With these default settings, zasm runs with less than 0x1800 bytes of RAM!

; Maximum number of symbols we can have in the global and consts registry
.equ	ZASM_REG_MAXCNT		0xff

; Maximum number of symbols we can have in the local registry
.equ	ZASM_LREG_MAXCNT	0x20

; Size of the symbol name buffer size. This is a pool. There is no maximum name
; length for a single symbol, just a maximum size for the whole pool.
; Global labels and consts have the same buf size
.equ	ZASM_REG_BUFSZ		0x700

; Size of the names buffer for the local context registry
.equ	ZASM_LREG_BUFSZ		0x100

; ******

.inc "err.h"
.org	USER_CODE

jp	zmakeMain

.inc "zasm/const.asm"
.inc "lib/util.asm"
.inc "zasm/util.asm"
.equ	IO_RAMSTART	USER_RAMSTART
.inc "zasm/io.asm"
.equ	TOK_RAMSTART	IO_RAMEND
.inc "zasm/tok.asm"
.inc "lib/parse.asm"
.equ	INS_RAMSTART	TOK_RAMEND
.inc "zasm/instr.asm"
.equ	DIREC_RAMSTART	INS_RAMEND
.inc "zasm/directive.asm"
.inc "zasm/parse.asm"
.inc "zasm/expr.asm"
.equ	SYM_RAMSTART	DIREC_RAMEND
.inc "zasm/symbol.asm"
.equ	ZASM_RAMSTART	SYM_RAMEND
.inc "zasm/main.asm"

zasmArgs:
	.db "8 9", 0
zmakeSrc:
	.db "XXXXXXXXXXXXXXXX"
zmakeSrcBase:
	.db "/glue.asm", 0
zmakeMain:
	ld de, ZASM_RAMEND+1
	call writeHLinDE
	ex de, hl
	call fdelRaw
	ex de, hl
	push hl
	ld a, 0xFF
	call fsAlloc
	ld hl, ZASM_RAMEND
	ld a, 5
	ld (hl), a
	call fopnRaw
	pop hl
	xor a
	call findchar
	ld b, a
	ld de, zmakeSrcBase
.copyname:
	dec de
	dec hl
	ld a, (hl)
	ld (de), a
	dec b
	jr nz, .copyname
	ld hl, ZASM_RAMEND
	ld a, 4
	ld (hl), a
	inc hl
	ex de, hl
	call writeHLinDE
	ld hl, ZASM_RAMEND
	call fopnRaw
	ld hl, zasmArgs
	jp zasmMain
