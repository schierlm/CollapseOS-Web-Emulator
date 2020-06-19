#!/bin/sh -e
if [ ! -f collapseos/README.md ]; then
	git submodule init
	git submodule update
fi
cd collapseos
if [ ! -f tools/blkpack ]; then
	git stash push --all
	rm -rf emul/libz80
	git submodule init
	git submodule update
	cd emul/libz80
	make
	cd ../../tools
	make blkpack
	cd ../emul
	make blkfs stage
	cd ..
fi
cd ..
rm -rf build
mkdir -p build
grep -v '1 25 LOADR' collapseos/blk/353 >collapseos/blk/3531
perl -n - emul0-xcomp.fs >build/emul0-bootstrap.fs <<'EOF'
if (/#=/) {
	foreach $i (/#=([0-9]+)/g) {
		print "( #=".$i." )".$/;
		system("cat collapseos/blk/$i");
	}
} else {
	print;
}
EOF
collapseos/tools/blkpack collapseos/blk >build/blk.bfs
for i in 0 1 2 3 ; do
	echo Building emul$i.rom
	collapseos/emul/stage <emul$i-xcomp.fs >build/emul$i.rom
done
echo "Done!"
