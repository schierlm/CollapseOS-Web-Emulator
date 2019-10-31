#!/bin/sh -e
if [ ! -f collapseos/README.md ]; then
	git submodule init
	git submodule update
fi
cd collapseos
if [ ! -f tools/cfspack/cfspack ]; then
	git stash push --all
	sed s/0x40000/0x400000/ -i tools/emul/zasm/zasm.c
	rm -rf tools/emul/libz80
	git submodule init
	git submodule update
	cd tools/emul/libz80
	make
	cd ..
	make zasm/zasm
	cd ../cfspack
	make cfspack
	cd ../..
fi
cd ..
rm -rf build
mkdir -p build/cfs/kernel build/cfs/zmake build/cfsbin
cp -R collapseos/kernel/* build/cfs/kernel
for dir in lib ed memt zasm; do cp -R collapseos/apps/$dir build/cfs; done
cp -R basic build/cfs
find build -name *.md | xargs rm
rm build/cfs/kernel/user.h.example
mv build/cfs/kernel/err.h build/cfs
cp user.h build/cfs
cp zmake-glue.asm build/cfs/zmake/glue.asm
for i in 1 2 3; do
	mkdir build/cfs/kernel.$i
	cp emul$i-glue.asm build/cfs/kernel.$i/glue.asm
done
collapseos/tools/cfspack/cfspack build/cfs >build/cfs.cfs
for app in zasm ed memt basic kernel.1 kernel.2 kernel.3 zmake; do
	echo Building $app
	collapseos/tools/emul/zasm/zasm build/cfs.cfs <build/cfs/$app/glue.asm >build/cfsbin/$app
done
collapseos/tools/cfspack/cfspack build/cfs >build/cfs.cfs
collapseos/tools/cfspack/cfspack build/cfsbin >>build/cfs.cfs
echo "Done!"
