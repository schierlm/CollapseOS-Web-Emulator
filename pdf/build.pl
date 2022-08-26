#!/usr/bin/perl

use warnings;
use strict;
use POSIX;
use MIME::Base64;

my $snapshot='2021-09-24';
my $timestamp = strftime("%Y-%m-%d %H:%M:%S", localtime time);
my $path = "../collapseos/doc/";

my @filelist = split($/, <<'DONE');
	=General Documentation
		intro.txt
		usage.txt
		impl.txt
		dict.txt
		blk.txt
		rxtx.txt
		blksrv.txt
		grok.txt
		design.txt
		ed.txt
		me.txt
		dis.txt
		emul.txt
		avr.txt
		wordtbl.txt
		cross.txt
		arch.txt
		bootstrap.txt
		drivers.txt
		grid.txt
		ps2.txt
		sega.txt
		selfhost.txt
		mspan.txt
		algo.txt
		faq.txt
	=Assemblers
		asm/intro.txt
		asm/z80.txt
		asm/8086.txt
		asm/6809.txt
		asm/6502.txt
		asm/avr.txt
	=How to read the code
		code/intro.txt
		code/z80.txt
		code/8086.txt
		code/6809.txt
		code/6502.txt
	=Hardware documentation
		hw/intro.txt
		hw/acia.txt
		hw/at28.txt
		hw/avr.txt
		hw/tty.txt
		sdcard.txt
		spi.txt
	=Hardware: z80 hardware interfaces
		hw/z80/ps2.txt
		PS/2 Connector!653x259!hw/z80/img/ps2-conn.png
		PS/2 74xx595!1017x425!hw/z80/img/ps2-595.png
		PS/2 ATtiny45!972x303!hw/z80/img/ps2-t45.png
		PS/2 Z80!450x474!hw/z80/img/ps2-z80.png
		hw/z80/spi.txt
		SPI Relay Schematic!1056x782!hw/z80/img/spirelay.jpg
		hw/z80/sio.txt
	=Hardware: Sega Master System (z80 based)
		hw/z80/sms/intro.txt
		hw/z80/sms/at28.txt
		SMS Dual EEPROM!626x646!hw/z80/sms/img/dual-at28.jpg
		hw/z80/sms/ps2.txt
		PS/2 interface!1830x918!hw/z80/sms/img/ps2-to-sms.png
		hw/z80/sms/pad.txt
		hw/z80/sms/spi.txt
		hw/z80/sms/vdp.txt
	=Hardware: Other z80 based devices
		hw/z80/dan.txt
		hw/z80/trs80-4p.txt
		hw/z80/z80mbc2.txt
		hw/z80/rc2014/intro.txt
		hw/z80/rc2014/acia.txt
		RC2014 ACIA!1133x681!hw/z80/rc2014/img/acia.jpg
		hw/z80/ti84/intro.txt
		hw/z80/ti84/lcd.txt
	=Hardware: 6502 based devices
		hw/6502/appleiie/intro.txt
		hw/6502/appleiie/monitor.txt
		hw/6502/appleiie/spihack.txt
		hw/6502/appleiie/spi.txt
	=Hardware: Various other devices
		hw/8086/pcat.txt
		hw/6809/coco2.txt
		hw/avr/at28.txt
		AT28 R/W!720x633!hw/avr/img/at28wr.jpg
		hw/avr/spispit.txt
DONE

my @blkfslist = split($/, <<'DONE');
	Architecture independent@../blk.fs
		Master Index: 0
		Useful little words: 1-5
		Pager: 6
		Flow words: 7
		RX/TX tools: 10-15
		Block editor: 20-24
		Visual editor: 25-32
		Memory editor: 35-39
		AVR SPI programmer: 40-43
		Sega ROM signer: 45
		Virgil's Workspace: 50-51
		Cross compilation: 200-205
		Core words: 210-229
		BLK subsystem: 230-234
		RX/TX subsystem: 235
		Media Span subsystem: 237
		Grid subsystem: 240-241
		PS/2 keyboard subsystem: 245-248
		SD Card subsystem: 250-258
		Fonts: 260-276
		Automated tests: 290-296
	Z80@../arch/z80/blk.fs
		Architecture index: 300
		Z80 boot code: 301-314
		Z80 assembler: 320-329
		AT28 EEPROM: 330
		SPI relay: 332
		TMS9918: 335-337
		MC6850 driver: 340-342
		Zilog SIO driver: 345-348
		Sega Master System VDP: 350-352
		SMS PAD: 355-358
		SMS KBD: 360-361
		SMS SPI relay: 367
		SMS Ports: 368-369
		TI-84+ LCD: 370-373
		TI-84+ Keyboard: 375-379
		TRS-80 4P drivers: 380-391
		Dan SBC drivers: 395-409
		Virgil's workspace: 410-416
	AVR@../arch/avr/blk.fs
		Architecture index: 300
		AVR macros: 301
		AVR assembler: 302-312
		ATmega328P definitions: 315
		SMS PS/2 controller: 320-342
		Arduino blinker: 345
		Arduino SPI spitter: 350-351
	8086@../arch/8086/blk.fs
		Architecture index: 300
		8086 boot code: 301-309
		8086 assembler: 311-318
		8086 drivers: 320-324
	6809@../arch/6809/blk.fs
		Architecture index: 300
		6809 macros: 301
		6809 boot code: 302-305
		6809 HAL: 306-310
		6809 assembler: 311-318
		TRS-80 Color Computer 2: 320-324
		6809 disassembler: 325-336
		6809 emulator: 340-354
		Virgil's workspace: 360-361
	6502@../arch/6502/blk.fs
		Architecture index: 300
		6502 macros and consts: 301
		6502 assembler: 302-307
		6502 port macros: 309
		6502 boot code: 310-321
		6502 disassembler: 330-334
		6502 emulator: 335-342
		Virgil's workspace: 348-353
		Apple IIe drivers: 360-365
DONE

sub escapeText {
	my $text = $_[0];
	$text =~ s/&/&amp;/g;
	$text =~ s/</&lt;/g;
	$text =~ s/>/&gt;/g;
	$text =~ s/"/&quot;/g;
	$text =~ s/( + )/'<text:s text:c="' . length($1) . '" \/>'/eg;
	$text =~ s/^ /<text:s \/>/g;
	return $text;
}

open(my $in, "<", "template.fodt") or die $!;
while(<$in>) {
	s/#SNAPSHOT#/$snapshot/;
	s/#TIMESTAMP#/$timestamp/;
	last if (/#CONTENT#/);
	print
}

our %filenames = map { $_ => 1 } grep { $_ ne '' } map { my $n = $_; $n=~s/^\s+//; $n=~s/=.*//; $n=~s/.*!//; $n } @filelist;


sub makeLink {
	my $name = $_[0];
	my $context = $_[1];
	my $dest = $name;
	$dest =~ s/^\/?doc\///;
	unless (defined $filenames{$dest}) {
		my $rest = $context;
		$rest =~s/[^\/]+$//;
		if (defined $filenames{$rest.$dest}) {
			$dest = $rest . $dest;
		}
		if (defined $filenames{$rest.'img/'.$dest}) {
			$dest = $rest . 'img/'. $dest;
		}
		# workarounds
		$dest = 'hw/z80/ps2.txt' if $dest eq 'hw/ps2.txt';
		$dest = 'hw/z80/sms/ps2.txt' if $dest eq 'smsps2.txt';
		$dest = 'asm/avr.txt' if $dest eq 'asm.txt' and $context eq 'hw/avr.txt';
		$dest = 'spi.txt' if $dest eq 'hw/spi.txt';
		$dest = 'wordtbl.txt' if $dest eq 'hal.txt';
	}
	unless (defined $filenames{$dest} and $filenames{$dest} == 1) {
		die "Unsupported name " . $dest . " in " . $context . $/;
	}
	return '<text:a xlink:type="simple" xlink:href="#' . $dest .
		'" text:style-name="Internet_20_link" text:visited-style-name="Internet_20_link">' . $name .
		'<text:span text:style-name="PageLink">Page <text:bookmark-ref text:reference-format="page" text:ref-name="' . $dest .
		'">0</text:bookmark-ref></text:span></text:a>';
}

foreach (@filelist) {
	s/^\s+//;
	if (/=(.*)/) {
		print '<text:h text:style-name="Heading_20_2" text:outline-level="2">' . escapeText($1) . "</text:h>" . $/;
	} elsif (/(.*)!(.*)x(.*)!(.*\.(jpg|png))/) {
		my $title = $1;
		my $width = $2;
		my $height = $3;
		my $filename = $4;
		my $ext=$5;
		my $scaleheight =  17 * $height / $width;
		open (my $image, "<", $path . $filename) or die "$!";
		my $rawstring = do { local $/ = undef; <$image>; };
		close $image;
		print '<text:h text:style-name="Heading_20_3" text:outline-level="3">' .
			'<text:bookmark text:name="' . $filename . '" />' .
			escapeText($title) . ' (<text:span text:style-name="Source_20_Text">' .
			$filename . '</text:span>)</text:h>' . $/;
		print '<text:p text:style-name="Text_20_body"><draw:frame draw:style-name="Graphics" text:anchor-type="as-char" svg:width="17cm" svg:height="' . $scaleheight . 'cm" draw:z-index="0">' .
			'<draw:image draw:mime-type="image/'. $ext . '"><office:binary-data>' . encode_base64($rawstring) .
			'</office:binary-data></draw:image></draw:frame></text:p>'.$/;
	} else {
		my $filename=$_;
		open (my $doc, "<", $path . $filename) or die "$!";
		my $line = <$doc>;
		chomp $line;
		die unless $line =~ /^# (.*)$/;
		print '<text:h text:style-name="Heading_20_3" text:outline-level="3">' .
			'<text:bookmark text:name="' . $filename . '" />' .
			escapeText($1) . ' (<text:span text:style-name="Source_20_Text">' .
			escapeText($filename) . '</text:span>)</text:h>' . $/;
		$line = <$doc>;
		chomp $line;
		die unless $line eq '';
		my $state = 0;
		while ($line = <$doc>) {
			chomp $line;
			$line = escapeText($line);
			if ($line =~ /^# (.*)$/) {
				if ($state == 1) {
					print '<text:s/></text:p>' . $/;
					$state = 0;
				}
				print '<text:h text:style-name="Heading_20_4" text:outline-level="4">' . $1 . '</text:h>' . $/;
			} else {
				if ($state == 0) {
					print '<text:p text:style-name="TextFile">';
					$state = 1;
				} else {
					print '<text:line-break/>';
				}
				$line =~ s/([a-z0-9\/-]+\.(txt|png|jpg))/makeLink($1,$filename)/eg;
				print $line;
			}
		}
		close $doc;
		if ($state == 1) {
			# without that space, some page breaks are "jumping" in LibreOffice, making PDF export fail.
			print '<text:s/></text:p>' . $/;
		}
	}
}

while(<$in>) {
	last if (/#BLKFS#/);
	print
}

my $blkfs;
my $nextblk=999;
my $blkoffs;
foreach (@blkfslist) {
	s/^\s+//;
	if (/(.*)@(.*)/) {
		my $title=$1;
		my $filename=$2;
		if ($nextblk != 999) {
			die "Remaining block " . $nextblk;
		}
		open ($blkfs, "<", $path . $filename) or die "$!";
		my $line = <$blkfs>;
		chomp $line;
		die "Unsupported first line " . $line . " in " . $filename unless $line eq '( ----- 000 )';
		if ($filename eq '../blk.fs') {
			$blkoffs=0;
		} else {
			$blkoffs=300;
		}
		$nextblk = $blkoffs;
		print '<text:h text:style-name="Heading_20_2" text:outline-level="2">' . escapeText($title) . "</text:h>" . $/;
	} elsif (/(.*: ([0-9]+)(-[0-9]+)?)/) {
		my $title = $1;
		my $blkfrom = $2;
		my $blkto = $3;
		$blkto = "-" . $blkfrom if not defined $blkto;
		$blkto =~ s/^-//;
		die "Encountering block " . $nextblk . " for " . $title if $nextblk != $blkfrom;
		print '<text:h text:style-name="Heading_20_3" text:outline-level="3">' . escapeText($title) . '</text:h>' . $/;
		while($nextblk <= $blkto) {
			print '<text:h text:style-name="Heading_20_4" text:outline-level="4">B' . $nextblk . '</text:h>' . $/;
			print '<text:p text:style-name="BlockContent">';
			my $lcnt = 0;
			$nextblk = 999;
			while(my $line = <$blkfs>) {
				chomp $line;
				if ($line =~ /^\( ----- ([0-9]+) \)$/) {
					$nextblk = $blkoffs + $1;
					last;
				}
				die "Line too long" if  length($line) > 64;
				$line = $line . " " x (64 - length($line));
				die "Line too short" if length($line) != 64;
				print escapeText($line) . '<text:line-break/>';
				$lcnt++;
			}
			while($lcnt < 15) {
				print '<text:line-break/>';
				$lcnt++;
			}
			print '</text:p>' . $/;
			if ($nextblk == 299) {
				my $line = <$blkfs>;
				die "299 not empty: " . $line if defined $line;
				$nextblk = 999;
			}
			if ($nextblk == 999) {
				close $blkfs;
			}
		}
	} else {
		die "Unsupported line " . $_;
	}
}

while(<$in>) {
	print
}
close $in;
