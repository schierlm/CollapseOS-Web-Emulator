; *** SHELL COMMANDS ***
fsOnCmd:
	.db	"fson", 0, 0, 0
	jp	fsOn

; Lists filenames in currently active FS
flsCmd:
	.db	"fls", 0, 0, 0, 0
	ld	iy, .iter
	call	fsIter
	ret	z
	ld	a, FS_ERR_NO_FS
	ret
.iter:
	ld	a, FS_META_FNAME_OFFSET
	call	addHL
	call	printstr
	jp	printcrlf

; Takes one byte block number to allocate as well we one string arg filename
; and allocates a new file in the current fs.
fnewCmd:
	.db	"fnew", 0b001, 0b1001, 0b001
	push	hl
	ld	a, (hl)
	inc	hl
	call	intoHL
	call	fsAlloc
	pop	hl
	xor	a
	ret

; Deletes filename with specified name
fdelCmd:
	.db	"fdel", 0b1001, 0b001, 0
	push	hl
	call	intoHL		; HL now holds the string we look for
	call	fsFindFN
	jr	nz, .notfound
	; Found! delete
	call	fsDel
	jr	z, .end
	; weird error, continue to error condition
.notfound:
	ld	a, FS_ERR_NOT_FOUND
.end:
	pop	hl
	ret


; Opens specified filename in specified file handle.
; First argument is file handle, second one is file name.
; Example: fopn 0 foo.txt
fopnCmd:
	.db	"fopn", 0b001, 0b1001, 0b001
	push	hl
	push	de
	ld	a, (hl)		; file handle index
	call	fsHandle
	; DE now points to file handle
	inc	hl
	call	intoHL		; HL now holds the string we look for
	call	fsFindFN
	jr	nz, .notfound
	; Found!
	; FS_PTR points to the file we want to open
	push	de \ pop ix	; IX now points to the file handle.
	call	fsOpen
	jr	.end
.notfound:
	ld	a, FS_ERR_NOT_FOUND
.end:
	pop	de
	pop	hl
	ret
