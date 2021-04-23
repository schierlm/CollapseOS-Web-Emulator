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
perl -n - emul0-xcomp.fs >build/emul0-bootstrap.fs <<'EOF'
sub printblock {
	my $num = $_[0];
	open(my $in, "<", "collapseos/blk.fs") or die $!;
	my $write=0;
	while(my $line = <$in>) {
		chomp $line;
		if ($line =~ /^\( ----- $num \)$/) {
			$write = 1;
			next;
		} elsif ($write and $line =~ /^\( ----- [0-9]+ \)$/) {
			$write = 0;
			last;
		}
		print $line.$/ if $write;
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
sed -i "s/^'?/( ((( ) '?/g;s/THEN\]$/THEN\] ( ))) )/g" build/emul0-bootstrap.fs
echo 'ORG @ 256 /MOD 2 PC! 2 PC! HERE 256 /MOD 2 PC! 2 PC!' >>build/emul0-bootstrap.fs
collapseos/tools/blkpack < collapseos/blk.fs > build/blk.bfs
for i in 0 1 2 3 4 ; do
	echo Building emul$i.rom
	collapseos/cvm/stage <emul$i-xcomp.fs >build/emul$i.rom
done
echo "Done!"
