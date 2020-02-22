#!/bin/sh -e
if [ ! -f collapseos/README.md ]; then
	git submodule init
	git submodule update
fi
cd collapseos
if [ ! -f tools/cfspack/cfspack ]; then
	git stash push --all
	sed s/0x80000/0x400000/ -i emul/zasm/zasm.c
	rm -rf emul/libz80
	git submodule init
	git submodule update
	cd emul/libz80
	make
	cd ..
	make zasm/zasm
	cd ../tools/cfspack
	make cfspack
	cd ../..
fi
cd ..
rm -rf build
mkdir -p build/cfs/kernel build/cfs/zmake build/cfs/avra build/cfsbin
cp -R collapseos/kernel/* build/cfs/kernel
for dir in lib basic ed memt zasm; do cp -R collapseos/apps/$dir build/cfs; done
cp -R tbasic build/cfs
find build -name *.md | xargs rm
rm build/cfs/kernel/user.h.example
mv build/cfs/kernel/*.h build/cfs/kernel/fnt build/cfs/kernel/core.asm build/cfs
mv build/cfs/zasm/gluea.asm build/cfs/avra/glue.asm
cp user.h build/cfs
cp zmake-glue.asm build/cfs/zmake/glue.asm
for i in 1 2 3; do
	mkdir build/cfs/kernel.$i
	cp emul$i-glue.asm build/cfs/kernel.$i/glue.asm
	echo Building kernel.$i
	collapseos/emul/zasm/zasm build/cfs <build/cfs/kernel.$i/glue.asm >build/cfsbin/kernel.$i
done
for app in zasm ed memt tbasic basic zmake avra; do
	echo Building $app
	collapseos/emul/zasm/zasm -o 62 build/cfs <build/cfs/$app/glue.asm >build/cfsbin/$app
done
collapseos/tools/cfspack/cfspack build/cfs >build/cfs.cfs
collapseos/tools/cfspack/cfspack build/cfsbin >>build/cfs.cfs
echo "Done!"
