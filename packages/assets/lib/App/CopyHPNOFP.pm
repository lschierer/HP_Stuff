#!/usr/bin/env perl
use v5.40.0;
use experimental qw(class);
use utf8::all;
use Carp;
use File::FindLib 'lib';

package App::CopyHPNOFP 0.01;
use parent qw(App::Cmd::Simple);
require CopyHPNOFP::Command;

sub opt_spec {
  return (
    [ "output|o=s", "output directory", { required => 1  } ],
    [ "input|i=s",  "input directory", {required => 1 } ],
    [ "assets|a=s", "asset directory", {required => 1 } ],
    [ "styles|s=s", "styles directory", {required => 1 }],
  );
}

sub validate_args {
  my ($self, $opt, $args) = @_;
  # no args allowed but options!
  $self->usage_error("No args allowed") if @$args;
}

sub execute {
  my ($self, $opt, $args) = @_;
  if($opt->{output}) {
    my $command =  CopyHPNOFP::Command->new(
      outputDir => $opt->{output},
      inputDir  => $opt->{input},
      assetDir  => $opt->{assets},
      stylesDir  => $opt->{styles},
    );
    $command->execute();
  } else {
    say 'No Output Directory Specified, not copying files.'
  }
}
