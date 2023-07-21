+++
title = "Appendix E - Life Expectancy"
date = 2022-06-28T18:18:30-04:00
author = "Luke Schierer"
weight = 24
+++

| Average Power Level | US Males 1900 | US Males 2001 | US Females 1900 | US Females 2001 | US Male Nephilim 1900 | US Male Nephilim 2001 | US Female Nephilim 1900 | US Female Nephilim 2001 
:--------------------:|:-------------:|:-------------:|:---------------:|:---------------:|:---------------------:|:---------------------:|:-----------------------:|:-----------------------:|
|          0          |     51.5      |     77.8      |      58.3       |      82.8       |         51.5          |         77.8          |          58.3           |          82.8           |
|          1          |     51.5      |     77.8      |      58.3       |      82.8       |         57.50         |         83.80         |          63.39          |          87.9           |
|          2          |     51.5      |     77.8      |      58.3       |      82.8       |         64.71         |         91.01         |          69.65          |          94.15          |
|          3          |     51.5      |     77.8      |      58.3       |      82.8       |         73.37         |         99.67         |          77.32          |         101.82          |
|          4          |     51.5      |     77.8      |      58.3       |      82.8       |         83.77         |        110.07         |          86.75          |         111.25          |
|          5          |     51.5      |     77.8      |      58.3       |      82.8       |         96.25         |        122.55         |          98.31          |         122.81          |
|          6          |     51.5      |     77.8      |      58.3       |      82.8       |        111.24         |        137.55         |         112.51          |         137.01          |
|          7          |     51.5      |     77.8      |      58.3       |      82.8       |        129.25         |        155.55         |         129.94          |         154.44          |
|          8          |     51.5      |     77.8      |      58.3       |      82.8       |        150.86         |        177.16         |         151.33          |         175.83          |
|          9          |     51.5      |     77.8      |      58.3       |      82.8       |        176.82         |        203.12         |         177.60          |          202.1          |
|          10         |     51.5      |     77.8      |      58.3       |      82.8       |        207.99         |        234.29         |         209.83          |         234.33          |

The above table is in part based on Ms. Felicitie C. Bell, Mr. Michael L. Miller.  "[Life Tables for the United States Social Security Area 1900-2100](https://www.ssa.gov/oact/NOTES/pdf_studies/study120.pdf)" 2005-08. SSA Pub. No. 11-11536.
I'm using 1900's US numbers essentially because 1) I do not have UK numbers 2)
1900's numbers seams to me a reasonable average between the effects of the magic
that nephil would use (cooling charms, preservation charms, medical charms and
potions), versus their tendency to ignore non-magical advances in science after
the statute of secrecy.

The extend to which magic extends the nephil's life depends on the nephil's
average power level. For males, I settled on the formula 
```
a = x-29.9+29.9e^0.183y 
```
where a is their estimated average lifespan, x is the
life expectancy for a non-magical person, e is Euler's number, and y is the
average of their nine power levels. For females, using the same variables, I
settled on the formula 
```
a = x-22.39+22.39e^0.205y
```
 I chose the different formulas
because while it does not fully remove the fact that women normally live longer
than men, it does massively reduce the delta. I decided (while I have no proof
of this) a large part of the difference between male and female humans has got
to be either the effects of more guys involved in wars or disease (or both).

Looking at the above, Euphemia should have had a life expectancy of around 130
years and Fleamont of around 111 years, yet they had James at around 68 and died
at around 87.  The first says that magic is extending fertility as well as
lifespan.  The second says that these are *average* numbers, and that there are
still magical diseases that can drastically shorten them (since we know they
died of dragon pox).

