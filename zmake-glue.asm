; zmake - based on zasm
;
; Reads input from FOO/glue.asm, assemble the binary in two passes and
; spit the result into FOO. FOO is deleted if it exists, and recreated
; with maximum block count.
;
; *** Requirements ***
; strncmp
; upcase
; findchar
; blkSel
; blkSet
; fsFindFN
; fsOpen
; fsGetB
; _blkGetB
; _blkPutB
; _blkSeek
; _blkTell
; printstr
;
; fsAlloc
; fsFindFN
; fsOpen
; fsDel


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
.inc "ascii.h"
.inc "blkdev.h"
.inc "fs.h"
jp	zmakeMain

.inc "core.asm"
.inc "zasm/const.asm"
.inc "lib/util.asm"
.inc "lib/ari.asm"
.inc "lib/parse.asm"
.inc "zasm/util.asm"
.equ	IO_RAMSTART	USER_RAMSTART
.inc "zasm/io.asm"
.equ	TOK_RAMSTART	IO_RAMEND
.inc "zasm/tok.asm"
.equ	INS_RAMSTART	TOK_RAMEND
.inc "zasm/instr.asm"
.equ	DIREC_RAMSTART	INS_RAMEND
.inc "zasm/directive.asm"
.inc "zasm/parse.asm"
.equ	EXPR_PARSE	parseNumberOrSymbol
.inc "lib/expr.asm"
.equ	SYM_RAMSTART	DIREC_RAMEND
.inc "zasm/symbol.asm"
.equ	ZASM_RAMSTART	SYM_RAMEND
.inc "zasm/main.asm"

zasmArgs:
	.db "8 9 62", 0
zmakeSrc:
	.db "XXXXXXXXXXXXXXXX"
zmakeSrcBase:
	.db "/glue.asm", 0
zmakeMain:
	call	fsFindFN
	jr	nz, .notfound
	call	fsDel
.notfound:
	push hl
	ld a, 0xFF
	call fsAlloc
	pop hl
	ld a, 5
	call fsHandle
	push de \ pop ix
	call fsOpen
	xor a
	call findchar
	ld b, a
	ld de, zmakeSrcBase
.copyname:
	dec de
	dec hl
	ld a, (hl)
	ld (de), a
	djnz .copyname
	push de \ pop hl
	call fsFindFN
	ld a, 4
	call fsHandle
	push de \ pop ix
	call fsOpen
	ld hl, zasmArgs
	jp zasmMain

USER_RAMSTART: