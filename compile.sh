#!/bin/sh -e
if [ ! -f collapseos/README ]; then
	git submodule init
	git submodule update
fi
cd collapseos
if [ ! -f tools/blkpack ]; then
	git stash push --all
	cd tools
	make blkpack
	cd ../cvm
	make blkfs stage
	cd ..
fi
cd ..
rm -rf build
mkdir -p build
cd pdf
./build.pl >../build/collapseos.fodt
cd ..
perl -n - emul0-xcomp.fs >build/emul0-bootstrap.fs <<'EOF'
sub printblock {
	my $num = $_[0];
	my $fs = "collapseos/blk.fs";
	if ($num =~ /^3/) {
		$num =~ s/^3/0/;
		$fs = "collapseos/cvm/cvm.fs";
	}
	open(my $in, "<", $fs) or die $!;
	my $write=0;
	while(my $line = <$in>) {
		chomp $line;
		if ($line =~ /^\( ----- $num \)$/) {
			$write = 1;
			next;
		} elsif ($write and $line =~ /^\( ----- [0-9]+ \)$/) {
			$write = 2;
			last;
		}
		print $line.$/ if $write;
	}
	if ($write ne 2) {
		die "Block $num not found!\n";
	}
	close($in);
}
if (/#=/) {
	foreach $i (/#=([0-9]+)/g) {
		print "( #=".$i." )".$/;
		printblock $i;
	}
} else {
	print;
}
EOF
sed -i "s/^'?/( ((( ) '?/g;s/CELLS! NOT \[IF\]/CELLS! NOT \[IF\]( ))) )/g;s/THEN\]$/THEN\] ( ))) )/g;s/THEN DROP ; \[THEN\]/THEN DROP ; ( ((( ) \[THEN\]/g;s/: XWRAP COREH/: XWRAP/g;s/ALIAS NOOP \[THEN\] ( ))) )/ALIAS NOOP \[THEN\]/g;s/^\\\\ # //g" build/emul0-bootstrap.fs
echo 'XORG 256 /MOD 2 PC! 2 PC! HERE 256 /MOD 2 PC! 2 PC!' >>build/emul0-bootstrap.fs
cat collapseos/arch/z80/blk.fs collapseos/arch/avr/blk.fs collapseos/arch/8086/blk.fs \
        collapseos/arch/6809/blk.fs collapseos/arch/6502/blk.fs >build/combined.fs
patch -d build <blkfs.patch
cat collapseos/blk.fs build/combined.fs | collapseos/tools/blkpack > build/blkfs.bfs
OVERLAY=collapseos/cvm/blkfs # for 0 only
for i in 0 1 2 3 4 ; do
	echo Building emul$i.rom
	collapseos/cvm/stage $OVERLAY <emul$i-xcomp.fs >build/emul$i.rom
	OVERLAY=build/blkfs.bfs # for 1 2 3 4
done
echo "Done!"
