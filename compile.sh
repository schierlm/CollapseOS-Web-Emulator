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
	cd ../vm
	make vm
	cd ..
fi
cd ..
rm -rf build
mkdir -p build
cd pdf
./build.pl >../build/collapseos.fodt
cd ..
perl bootstrap/build.pl emul0-xcomp.fs old-cvm.fs >build/emul0-bootstrap.fs
perl bootstrap/build.pl emul9-xcomp.fs collapseos/arch/6502/blk.fs >build/emul9-bootstrap.fs
sed -i "s/^'?/( ((( ) '?/g;s/CELLS! NOT \[IF\]/CELLS! NOT \[IF\]( ))) )/g;s/THEN\]$/THEN\] ( ))) )/g;s/THEN DROP ; \[THEN\]/THEN DROP ; ( ((( ) \[THEN\]/g;s/: XWRAP COREH/: XWRAP/g;s/ALIAS NOOP \[THEN\] ( ))) )/ALIAS NOOP \[THEN\]/g;s/^\\\\ # //g" build/emul0-bootstrap.fs
echo 'XORG 256 /MOD 2 PC! 2 PC! HERE 256 /MOD 2 PC! 2 PC!' >>build/emul0-bootstrap.fs
sed -i "s/: XWRAP COREH/: XWRAP/g" build/emul9-bootstrap.fs
echo 'XORG 256 /MOD 2 PC! 2 PC! HERE 256 /MOD 2 PC! 2 PC!' >>build/emul9-bootstrap.fs
cat collapseos/arch/z80/blk.fs collapseos/arch/avr/blk.fs collapseos/arch/8086/blk.fs \
        collapseos/arch/6809/blk.fs collapseos/arch/6502/blk.fs >build/combined.fs
patch -d build <blkfs.patch
cat collapseos/blk.fs collapseos/arch/6502/blk.fs | collapseos/tools/blkpack > build/6502.bfs
cat collapseos/blk.fs old-cvm.fs | collapseos/tools/blkpack > build/cvm.bfs
cat collapseos/blk.fs build/combined.fs | collapseos/tools/blkpack > build/blkfs.bfs

OVERLAY=build/cvm.bfs # for 0 only
for i in 0 1 2 3 4 ; do
	echo Building emul$i.rom
	collapseos/vm/vm -b $OVERLAY -i build/emul$i.rom <emul$i-xcomp.fs
	OVERLAY=build/blkfs.bfs # for 1 2 3 4
done
echo "Building emul9.rom (for VM bootstrap)"
collapseos/vm/vm -b build/6502.bfs -i build/emul9.rom <emul9-xcomp.fs
echo "Done!"
