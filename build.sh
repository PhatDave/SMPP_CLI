for file in client center; 
do 
	for target in windows linux
	do
		nexe -i $file.js -o out/$file-$target -t $target-x86-18.18.2 --build
	done
done