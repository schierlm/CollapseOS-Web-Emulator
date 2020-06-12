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
collapseos/tools/blkpack collapseos/blk >build/blk.bin
for i in 1 2 3 ; do
	echo Building emul$i.rom
	collapseos/emul/stage <emul$i-xcomp.fs >build/emul$i.rom
done
echo "Done!"
