#!/usr/bin/perl

use warnings;
use strict;

sub printblock {
	my $num = $_[0];
	my $fs = "collapseos/blk.fs";
	if ($num =~ /^3/) {
		$num =~ s/^3/0/;
		$fs = $ARGV[1];
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
open(my $in, "<", $ARGV[0]) or die $!;
while(<$in>) {
	if (/#=/) {
		foreach my $i (/#=([0-9]+)/g) {
			print "( #=".$i." )".$/;
			printblock $i;
		}
	} else {
		print;
	}
}
close $in;