use v5.40.0;
use experimental qw(class);
use utf8::all;
use File::FindLib 'lib';

require Data::Printer;

class CopyHPNOFP::Command {
  use Types::Common qw( -lexical -all);
  use List::AllUtils qw( any none );
  use open ':std', ':encoding(UTF-8)';
  require XML::LibXML;
  require HTML::HTML5::Writer;
  use Cwd;
  use HTML::Selector::XPath qw(selector_to_xpath);
  use namespace::autoclean;
  use Carp;
  use Path::Tiny;
  use Pandoc;
  our $VERSION = 'v0.0.1';
  my $debug = 0;

  field $inputDir :reader :param;

  field $outputDir :reader :param;

  field $assetDir :reader :param;

  field $stylesDir :reader :param;

  field $id;
  field $od;
  field $ad;
  field $sd;

  ADJUST {
    my $tp;

    $tp = path($inputDir);
    if($tp->exists()){
      if($tp->is_dir()) {
        $id = $tp;
      } else {
        croak "$inputDir is not a directory!!";
      }
    } else {
      croak "$inputDir does not exist!"
    }

    $tp = path($assetDir);
    if($tp->exists()){
      if($tp->is_dir()){
        $ad = $tp->child("HPNOFP");
        if(! $ad->exists()) {
          $ad->mkdir({mode => 0711,})
        }
      } else {
        croak "$assetDir is not a directory!!";
      }
    }else {
      croak "$assetDir does not exist!"
    }

    $tp = path($stylesDir);
    if($tp->exists()){
      if($tp->is_dir()){
        $sd = $tp->child("HPNOFP");
        if(! $sd->exists()) {
          $sd->mkdir({mode => 0711,})
        }
      } else {
        croak "$stylesDir is not a directory!!";
      }
    }else {
      croak "$stylesDir does not exist!"
    }

    $tp = path($outputDir);
    if($tp->exists()){
      if($tp->is_dir()){
        $od = $tp->child('Harry Potter and the Nightmares of Futures Past');
        if(! $od->exists()) {
          $od->mkdir({mode => 0711,})
        }
      } else {
        croak "$outputDir is not a directory!!";
      }
    }else {
      croak "$outputDir does not exist!"
    }
  }



  method processFile ($file) {
    if($file->is_file()) {
      if($debug) {
        binmode STDOUT, ':utf8';
        say "processing $file";
      }
      my $writer = HTML::HTML5::Writer->new(
        markup_declaration => 0,
      );
      my $name = $file->basename('.xhtml');

      my $output = $od->child("$name.md");



      open(my $fh, "<:utf8", $file) || croak "could not open $file: $!";
      binmode $fh, ':raw';
      my $dom = XML::LibXML->load_html(
          IO => $fh,
          recover   => 1,
      );

      # Add more debugging for h2 tag search
      my @h2nodes = $dom->findnodes('//h2');
      if($debug) {
        say "Found " . scalar(@h2nodes) . " h2 nodes in $name";
        if (scalar(@h2nodes) > 0) {
          my $h2t = $h2nodes[0]->textContent;
          say "First h2 content: $h2t";
        } else {
          say "No h2 tags found in document";
        }
      }

      my $titleNode = $h2nodes[0];
      my $titleText = $titleNode ? $titleNode->textContent : undef;

      $titleText //= "Harry Potter and the Nightmares of Futures Past - $name";

      if($debug) {
        say "Using title: $titleText for $name";
      }

      foreach my $linkNode ($dom->findnodes('//link[@href]')) {
        $linkNode->setAttribute('href', "../../../styles/hpnofp/style.css");
      }

      foreach my $anchorNode ($dom->findnodes('//a[@href]')) {
        my $target = $anchorNode->getAttribute('href');

        # Handle links with fragments
        if ($target =~ /^(.*)\.xhtml(#.*)?$/) {
          my $base = $1;
          my $fragment = $2 || '';

          # If this is a link to a chapter or author notes, make it an absolute path
          if ($base =~ /^(Chapter\d+|AuthorNotes)$/) {
            $target = "/FanFiction/Harry Potter and the Nightmares of Futures Past/$base/$fragment";
          } else {
            # Otherwise, keep it as a relative path
            $target = "$base/$fragment";
          }
        } elsif ($target =~ /^#(.*)$/) {
          # Handle same-page fragments - keep as is
          $target = "#$1";
        }

        $anchorNode->setAttribute('href', $target);

        if($debug) {
          say "Processed link: " . $anchorNode->getAttribute('href');
        }
      }

      foreach my $imgNode ($dom->findnodes('//img')) {
        my $cursrc = $imgNode->getAttribute('src');
        my $imgPath = sprintf("/%s/%s", $ad->relative(path($assetDir)->parent()), $cursrc);
        $imgNode->setAttribute('src', $imgPath);
      }

      my $bt = $dom->findnodes('//body')->[0];
      my $article = $dom->createElement('article');
      my $deepClone = 1;
      foreach my $child ($bt->childNodes()) {
        my $imported = $child->cloneNode($deepClone);
        $article->appendChild($imported);
      }

      # Get the body element as a string without the DOCTYPE
      # Use the element method directly which handles a single node
      my $html = $writer->element($article);

      if($titleText eq 'Table of Contents') {
        $titleText = 'Harry Potter and the Nightmares of Futures Past';

        # This is the TOC file, so we need to extract the nav element and save it separately
        if($debug) {
          say "Found TOC file, extracting nav fragment";
        }

        # Find the nav element (or main element if that's what contains the TOC)
        my $navXpath = selector_to_xpath('.coverpage');
        my $navElement = $dom->findnodes($navXpath)->[0];
        if (!$navElement) {
          # If there's no nav element, try to find the main element
          $navElement = $dom->findnodes('//main')->[0];
          if($debug) {
            say "No nav element found, using main element instead";
          }
        }

        if ($navElement) {
          $navElement->removeAttribute('epub:type');
          # Create a new HTML fragment file with just the nav content

          my $navFragmentPath = $od->child('nav.fragment.html');
          my $navHtml = $writer->element($navElement);
          $navHtml =~ s{
              (<a\s+[^>]*?href=")      # Start of the href attribute
              (?!https?:|/|\.\.)       # Skip already absolute or protocol-based URLs
              ([^"]+)                  # Capture relative path (e.g., 'Year1/')
              (")                      # Closing quote
          }{$1/FanFiction/Harry Potter and the Nightmares of Futures Past/$2$3}xg;
          $navFragmentPath->spew_utf8($navHtml);

        } else {
          if($debug) {
            say "Could not find nav or main element in TOC file";
          }
        }
      }

      # on visual inspection, the files do not contain the author in predictable places.
      # There are however only a few of them, so just hard code it based on the titles.
      my $author = '';
      if($titleText =~ /A Night at The Burrow/){
        $author = 'Worfe';
      } elsif($titleText =~ /G for Ginevra/) {
        $author = 'Peach Wookiee';
      } else {
        $author = 'Matthew Schocke';
      }
      my $markdown = pandoc->convert(
        'html' => 'gfm',
        $html,
        '--wrap=none'
      );
      my $outDoc = sprintf(
        "---\ntitle: >-\n  %s\nauthor: %s\ncollection: %s\nlayout: %s\n---\n%s",
        $titleText,
        $author,
        "\n  - HPNOFP\n  - FanFiction\n",
        "HPNOFP",
        $markdown
      );

      $output->spew_utf8($outDoc);


      return $titleText;
    } else {
      say "skipping $file - it is not a file";
    }
  }

  method execute() {
    if($debug) {
      binmode *STDOUT, ':utf8';
      say "starting CopyHPNOFP::Command->execute()";
    }

    foreach my $childItem ( $id->children( qr/\.xhtml\z/ ) ) {
      my $title = $self->processFile($childItem);
      if($debug) {
        say "got title $title from \$self->processFile";
      }

      foreach my $childItem ($id->children( qr/\.css\z/ )) {
        my $name = $childItem->basename();
        my $output = $sd->child($name);
        $childItem->copy($output);
      }

      foreach my $childItem ($id->children( qr/\.jpg\z/ )) {
        my $name = $childItem->basename();
        my $output = $ad->child($name);
        $childItem->copy($output);
      }

      foreach my $childItem ($id->children( qr/\.gif\z/ )) {
        my $name = $childItem->basename();
        my $output = $ad->child($name);
        $childItem->copy($output);
      }
    }

  }
}
