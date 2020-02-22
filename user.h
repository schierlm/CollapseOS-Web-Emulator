.equ    USER_CODE       0x6200  ; in sync with glue.asm

; *** JUMP TABLE ***
.equ	strncmp			0x03
.equ	upcase			@+3
.equ	findchar		@+3
.equ	blkSelPtr		@+3
.equ	blkSel			@+3
.equ	blkSet			@+3
.equ	blkSeek			@+3
.equ	blkTell			@+3
.equ	blkGetB			@+3
.equ	blkPutB			@+3
.equ	fsFindFN		@+3
.equ	fsOpen			@+3
.equ	fsGetB			@+3
.equ	fsPutB			@+3
.equ	fsSetSize		@+3
.equ	fsOn    		@+3
.equ	fsIter    		@+3
.equ	fsAlloc    		@+3
.equ	fsDel    		@+3
.equ	fsHandle   		@+3
.equ	printstr		@+3
.equ	printnstr		@+3
.equ	_blkGetB		@+3
.equ	_blkPutB		@+3
.equ	_blkSeek		@+3
.equ	_blkTell		@+3
.equ	printcrlf		@+3
.equ	stdioGetC		@+3
.equ	stdioPutC		@+3
.equ	stdioReadLine	@+3
