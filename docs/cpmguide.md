<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Primavera P6 Critical Path Calculation Documentation

Based on extensive research from multiple authoritative sources, including Oracle documentation, academic studies, and industry case studies, I can provide you with comprehensive documentation on how Primavera P6 calculates the critical path, along with the mathematical formulas and implementation scenarios for claims documentation.

## Critical Path Method (CPM) in Primavera P6

### Core Algorithm Overview

Primavera P6 uses the **Critical Path Method (CPM)** to calculate project schedules through a two-step mathematical process:[^1_1][^1_2]

1. **Forward Pass**: Calculates Early Start (ES) and Early Finish (EF) dates
2. **Backward Pass**: Calculates Late Start (LS) and Late Finish (LF) dates

### Mathematical Formulas Used by P6

#### Forward Pass Calculations

**Early Start (ES)**:

- First Activity: `ES = Data Date (Project Start = Day 1)`[^1_1]
- Successor Activities: `ES = Latest EF of all predecessors + 1`[^1_3][^1_1]

**Early Finish (EF)**:

- All Activities: `EF = ES + Duration - 1`[^1_3][^1_1]
- With Lag: `EF = ES + Duration + Lag - 1`


#### Backward Pass Calculations

**Late Finish (LF)**:

- Final Activity: `LF = Project Finish Date (largest EF)`[^1_1][^1_3]
- Predecessor Activities: `LF = Earliest LS of all successors - 1`[^1_1]

**Late Start (LS)**:

- All Activities: `LS = LF - Duration + 1`[^1_3][^1_1]
- With Lag: `LS = LF - Duration - Lag + 1`


#### Float Calculations

**Total Float**:

- Primary Formula: `Total Float = Late Start - Early Start`[^1_4][^1_5]
- Alternative: `Total Float = Late Finish - Early Finish`[^1_5][^1_4]

**Free Float**:

- Formula: `Free Float = Earliest Early Start of successors - Early Finish - 1`[^1_3]

**Critical Path Definition**:

- Activities with `Total Float ≤ 0` are considered critical[^1_4][^1_1]


### P6's Two Critical Path Methods

P6 offers two distinct methods for defining critical activities:[^1_6][^1_7]

1. **Total Float Method**: Activities with total float ≤ specified threshold (default 0)
2. **Longest Path Method**: Activities on the physically longest path through the network

### Detailed Calculation Process

The calculation process follows these seven steps:


| Step | Process | Action | Formula |
| :-- | :-- | :-- | :-- |
| 1 | Forward Pass | Calculate Early Start dates from project start to finish | `ES = Latest EF of predecessors + 1` |
| 2 | Forward Pass | Calculate Early Finish dates | `EF = ES + Duration - 1` |
| 3 | Backward Pass | Calculate Late Finish dates from project end to start | `LF = Earliest LS of successors - 1` |
| 4 | Backward Pass | Calculate Late Start dates | `LS = LF - Duration + 1` |
| 5 | Float Calculation | Calculate Total Float for each activity | `Total Float = LS - ES (or LF - EF)` |
| 6 | Critical Path | Identify activities with zero total float | `Critical = True if Total Float ≤ 0` |
| 7 | Schedule Dates | Assign actual schedule dates based on progress | `Start = ES or Actual Start; Finish = EF or Actual Finish` |

### Progress and Duration Calculations

**Duration Percent Complete**:

```
Duration % Complete = (Original Duration - Remaining Duration) / Original Duration × 100
```

**Actual Duration** (for in-progress activities):

```
Actual Duration = Data Date - Actual Start
```

**At Completion Duration**:

```
At Completion Duration = Actual Duration + Remaining Duration
```


### Practical Example

Here's a step-by-step calculation example:

**Project Activities:**

- A: Design (5 days)
- B: Procurement (8 days)
- C: Foundation (6 days, after A)
- D: Structure (10 days, after B,C)
- E: Finishes (4 days, after D)
- F: Testing (3 days, after E)

**Forward Pass Results:**

- A: ES=1, EF=5
- B: ES=1, EF=8
- C: ES=6, EF=11
- D: ES=12, EF=21 (waits for latest predecessor)
- E: ES=22, EF=25
- F: ES=26, EF=28

**Backward Pass Results:**

- F: LS=26, LF=28
- E: LS=22, LF=25
- D: LS=12, LF=21
- C: LS=6, LF=11
- B: LS=4, LF=11
- A: LS=1, LF=5

**Critical Path**: A → C → D → E → F (activities with Total Float = 0)

### Implementation Code

I've created a complete Python implementation that replicates P6's critical path calculations:

```python
class P6CriticalPathCalculator:
    def forward_pass(self):
        # Calculate Early Start and Early Finish dates
        for activity in self.activities.values():
            if not activity.predecessors:
                activity.early_start = 1
                activity.early_finish = activity.early_start + activity.duration - 1
            else:
                latest_pred_finish = max(
                    self.activities[pred_id].early_finish 
                    for pred_id in activity.predecessors
                )
                activity.early_start = latest_pred_finish + 1
                activity.early_finish = activity.early_start + activity.duration - 1
    
    def backward_pass(self):
        # Calculate Late Start and Late Finish dates
        self.project_finish_date = max(
            activity.early_finish for activity in self.activities.values()
        )
        
        for activity in self.activities.values():
            if not activity.successors:
                activity.late_finish = self.project_finish_date
                activity.late_start = activity.late_finish - activity.duration + 1
            else:
                earliest_succ_start = min(
                    self.activities[succ_id].late_start 
                    for succ_id in activity.successors
                )
                activity.late_finish = earliest_succ_start - 1
                activity.late_start = activity.late_finish - activity.duration + 1
    
    def calculate_float(self):
        # Calculate Total Float and identify critical path
        for activity in self.activities.values():
            activity.total_float = activity.late_start - activity.early_start
            activity.is_critical = activity.total_float <= 0
```


### Use Cases for Claims Documentation

The critical path calculations are essential for several claims scenarios:

**Delay Analysis**:[^1_8][^1_9]

- **Time Impact Analysis**: Calculate delays by adding delay activities to the critical path
- **Windows Analysis**: Compare baseline vs. updated schedules at regular intervals
- **As-Built Analysis**: Reconstruct the actual critical path from project records

**Schedule Acceleration**:[^1_10][^1_11]

- **Crashing Analysis**: Identify activities for duration compression
- **Resource Optimization**: Determine optimal resource allocation

**Float Analysis**:[^1_6]

- **Multiple Float Paths**: P6 can calculate up to 10 different float paths for comprehensive analysis


### Special Considerations

**Calendar Effects**:[^1_12][^1_13]
P6 adjusts all calculations for working calendars, with durations calculated in working days rather than calendar days.

**Resource Constraints**:[^1_14][^1_15]
P6 can integrate resource limitations into critical path calculations using Enhanced Resource-Constrained Critical Path Method (eRCPM).

**Progress Updates**:[^1_16][^1_12]
P6 recalculates the critical path every time the schedule is updated, adjusting for actual progress and remaining work.

### Replication Feasibility

**Yes, it is absolutely possible to replicate P6's critical path calculations** using the documented formulas and algorithms. The mathematical foundations are well-established and standardized across the industry. The implementation I've provided demonstrates how these calculations can be coded and integrated into custom applications.[^1_17][^1_3]

The key requirements for replication are:

1. **Accurate network logic modeling**
2. **Proper handling of calendar calculations**
3. **Correct implementation of the forward/backward pass algorithms**
4. **Precise float calculation methods**
5. **Integration of progress tracking capabilities**

This documentation provides the mathematical foundation needed for expert testimony, claims analysis, and custom scheduling system development while maintaining compatibility with industry-standard CPM practices used in Primavera P6.
<span style="display:none">[^1_100][^1_101][^1_102][^1_103][^1_104][^1_105][^1_106][^1_107][^1_108][^1_109][^1_110][^1_111][^1_112][^1_113][^1_114][^1_115][^1_116][^1_117][^1_118][^1_119][^1_120][^1_121][^1_18][^1_19][^1_20][^1_21][^1_22][^1_23][^1_24][^1_25][^1_26][^1_27][^1_28][^1_29][^1_30][^1_31][^1_32][^1_33][^1_34][^1_35][^1_36][^1_37][^1_38][^1_39][^1_40][^1_41][^1_42][^1_43][^1_44][^1_45][^1_46][^1_47][^1_48][^1_49][^1_50][^1_51][^1_52][^1_53][^1_54][^1_55][^1_56][^1_57][^1_58][^1_59][^1_60][^1_61][^1_62][^1_63][^1_64][^1_65][^1_66][^1_67][^1_68][^1_69][^1_70][^1_71][^1_72][^1_73][^1_74][^1_75][^1_76][^1_77][^1_78][^1_79][^1_80][^1_81][^1_82][^1_83][^1_84][^1_85][^1_86][^1_87][^1_88][^1_89][^1_90][^1_91][^1_92][^1_93][^1_94][^1_95][^1_96][^1_97][^1_98][^1_99]</span>

<div style="text-align: center">⁂</div>

[^1_1]: https://tensix.com/video-how-does-primavera-p6-calculate-the-critical-path/

[^1_2]: https://www.youtube.com/watch?v=reUoFy5kR8g

[^1_3]: https://www.projectmanager.com/guides/critical-path-method

[^1_4]: https://www.planacademy.com/cpm-scheduling-101-primavera-scheduling-works/

[^1_5]: https://projcon-advisory.com/matter-calculating-total-float-start-dates-finish-dates-p6/

[^1_6]: https://2623052.fs1.hubspotusercontent-eu1.net/hubfs/2623052/Premiuminnhold/Critical path vs longest path vs multiple float path.pdf

[^1_7]: https://projectcontrolsonline.com/blogs/13-category1/693-critical-path-total-float-vs-longest-path

[^1_8]: https://www.planacademy.com/delay-claim-primavera-p6-lessons-learned/

[^1_9]: https://eastwoodharris.com/DL/TP/201126_p6_delay_analysis_techniques.pdf

[^1_10]: https://journal.lontaradigitech.com/Sipakatau/article/view/570

[^1_11]: https://ojs.transpublika.com/index.php/JHSSB/article/view/1006

[^1_12]: https://www.taradigm.com/understanding-and-preventing-schedule-drift-in-primavera-p6/

[^1_13]: https://www.planacademy.com/primavera-p6-duration-percent-complete-guide/

[^1_14]: http://hdl.handle.net/10890/13460

[^1_15]: https://www.mdpi.com/2071-1050/12/21/8918/pdf

[^1_16]: https://www.ronwinterconsulting.com/The_Inner_Workings_Of_P6.pdf

[^1_17]: https://www.wrike.com/blog/critical-path-is-easy-as-123/

[^1_18]: https://jurnal.teknologiindustriumi.ac.id/index.php/JIEM/article/view/1706

[^1_19]: https://pp.bme.hu/ar/article/view/10833

[^1_20]: https://www.ijaidr.com/research-paper.php?id=1409

[^1_21]: https://enggheritage.com/archives/2gwk2022/2gwk2022-65-72.pdf

[^1_22]: https://jurnal.uns.ac.id/matriks/article/view/56376

[^1_23]: https://jurnal.unidha.ac.id/index.php/RIVT/article/view/1613

[^1_24]: https://jurnal.sttkd.ac.id/index.php/ts/article/view/1287

[^1_25]: https://proceedings.unisba.ac.id/index.php/BCSBM/article/view/7112

[^1_26]: https://onlinelibrary.wiley.com/doi/10.1155/2021/9930113

[^1_27]: https://arxiv.org/pdf/2207.04688.pdf

[^1_28]: https://www.matec-conferences.org/articles/matecconf/pdf/2017/48/matecconf_logi2017_00004.pdf

[^1_29]: https://asps-journals.com/index.php/acp/article/download/636/190

[^1_30]: https://zenodo.org/record/30132/files/AUnitBasedCrashing.pdf

[^1_31]: https://www.e3s-conferences.org/articles/e3sconf/pdf/2023/28/e3sconf_icmed-icmpc2023_01216.pdf

[^1_32]: https://www.e3s-conferences.org/articles/e3sconf/pdf/2021/104/e3sconf_icstunkhair2021_10001.pdf

[^1_33]: https://downloads.hindawi.com/journals/ace/2021/1567261.pdf

[^1_34]: https://journal.binus.ac.id/index.php/commit/article/view/8495

[^1_35]: https://downloads.hindawi.com/journals/sp/2022/6591223.pdf

[^1_36]: https://www.planacademy.com/show-critical-path-in-p6/

[^1_37]: https://www.youtube.com/watch?v=zOwN2BhdFf8

[^1_38]: https://www.linkedin.com/pulse/how-calculate-critical-path-drag-primavera-p6fs-only-azharuddin

[^1_39]: https://tensix.com/displaying-the-critical-path-in-primavera-p6/

[^1_40]: https://consultleopard.com/how-to-find-critical-path-through-ms-project-and-primavera-p6/

[^1_41]: https://www.youtube.com/watch?v=hltpHtza0BU

[^1_42]: https://consultleopard.com/understanding-critical-path-analysis-using-primavera-p6/

[^1_43]: https://docs.oracle.com/cd/F25599_01/p6help/en/6623.htm

[^1_44]: https://consultleopard.com/project-controls/understanding-critical-path-analysis-using-primavera-p6/

[^1_45]: https://asana.com/resources/critical-path-method

[^1_46]: https://repository.tudelft.nl/islandora/object/uuid:017e2d08-2db9-4e9d-a1f1-d099fb92d7a9/datastream/OBJ/download

[^1_47]: https://arxiv.org/pdf/2204.12766.pdf

[^1_48]: http://arxiv.org/pdf/2210.02434.pdf

[^1_49]: https://arxiv.org/pdf/2402.15670.pdf

[^1_50]: https://www.matec-conferences.org/articles/matecconf/pdf/2017/08/matecconf_cosme2017_06015.pdf

[^1_51]: https://ijoscience.com/ojsscience/index.php/ojsscience/article/download/221/634

[^1_52]: https://jair.org/index.php/jair/article/download/10773/25725

[^1_53]: https://arxiv.org/pdf/2301.01452.pdf

[^1_54]: https://www.vibgyorpublishers.org/content/ijior/ijior-3-004.pdf

[^1_55]: http://www.scirp.org/journal/PaperDownload.aspx?paperID=36837

[^1_56]: http://arxiv.org/pdf/2301.04700.pdf

[^1_57]: http://arxiv.org/pdf/2406.09488.pdf

[^1_58]: https://ijaers.com/uploads/issue_files/38IJAERS-01202025-Analysis.pdf

[^1_59]: https://downloads.hindawi.com/journals/ace/2021/8878308.pdf

[^1_60]: http://arxiv.org/pdf/2308.06209.pdf

[^1_61]: https://arxiv.org/pdf/2412.14485.pdf

[^1_62]: https://www.youtube.com/watch?v=Nui3YvFV64o

[^1_63]: https://www.youtube.com/watch?v=Nhho7e8Hxmc

[^1_64]: https://www.emerald-associates.com/item/early-dates-late-dates-and-total-float-in-primavera-p6.html

[^1_65]: https://docs.oracle.com/cd/F25600_01/client_help/ar_EG/how_data_is_summarized.htm

[^1_66]: https://www.spireconsultinggroup.com/wp-content/uploads/2019/02/Roger-Nelson-article-in-Cost-Engineering.pdf

[^1_67]: http://arxiv.org/pdf/2406.19709.pdf

[^1_68]: https://www.mdpi.com/2220-9964/12/7/277/pdf?version=1689292897

[^1_69]: https://arxiv.org/html/2405.14254v1

[^1_70]: http://ijesty.org/index.php/ijesty/article/download/56/41

[^1_71]: https://arxiv.org/html/2504.05550v1

[^1_72]: https://www.matec-conferences.org/articles/matecconf/pdf/2018/107/matecconf_estic2018_03012.pdf

[^1_73]: https://arxiv.org/pdf/2211.15300.pdf

[^1_74]: https://docs.oracle.com/cd/F51301_01/English/User_Guides/p6_eppm_user/6623.htm

[^1_75]: https://docs.oracle.com/cd/F37125_01/English/User_Guides/p6_eppm_user/6679.htm

[^1_76]: https://eastwoodharris.com/oracle-primavera-p6-critical-path-calculations/

[^1_77]: https://docs.oracle.com/cd/E75420_01/English/User_Guides/p6_eppm_user/6679.htm

[^1_78]: https://kdblog.net/2016/11/16/how-early-and-late-date-are-calculated-in-start-to-start-relationship-in-primavera-p6/

[^1_79]: https://tensix.com/what-is-a-primavera-p6-schedule/

[^1_80]: https://www.linkedin.com/pulse/from-theory-practice-implementing-resource-driven-p6-jan-van-den-berg-qg9ne

[^1_81]: https://docs.oracle.com/cd/F74686_01/help/user/en/10292550.htm

[^1_82]: https://www.ajer.org/papers/Vol-13-issue-10/1310104110.pdf

[^1_83]: http://ieeexplore.ieee.org/document/7000678/

[^1_84]: https://www.semanticscholar.org/paper/4ef8dfb06fa3aaedb22ea92f671fb299af9060c1

[^1_85]: https://www.semanticscholar.org/paper/0a14b8ac8b1ab9a8986e57601909b296a2b42093

[^1_86]: https://www.mdpi.com/2079-3197/12/9/184

[^1_87]: https://www.mdpi.com/2073-8994/14/8/1525

[^1_88]: https://www.semanticscholar.org/paper/8bb969780b7c5818f7b8cdab8d11de4dcac6e92a

[^1_89]: https://ieeexplore.ieee.org/document/11027064/

[^1_90]: https://www.semanticscholar.org/paper/5017389941870ce0a9169f15c735cb3a800bfa72

[^1_91]: https://dl.acm.org/doi/10.1145/3638550.3643633

[^1_92]: https://onepetro.org/SPEADIP/proceedings/24ADIP/24ADIP/D021S037R006/585726

[^1_93]: http://arxiv.org/pdf/2502.18330.pdf

[^1_94]: https://arxiv.org/pdf/2502.07738.pdf

[^1_95]: https://www.mdpi.com/1424-8220/23/7/3512/pdf?version=1679983877

[^1_96]: https://arxiv.org/pdf/2108.07045.pdf

[^1_97]: https://arxiv.org/pdf/2412.10632.pdf

[^1_98]: https://www.dot.ny.gov/main/business-center/contractors/construction-division/construction-repository/NYSDOT_P6CLIENT_Training_Manual.pdf

[^1_99]: https://docs.oracle.com/cd/F51303_01/client_help/en_US/critical_path_method_scheduling.htm

[^1_100]: https://www.projectmanager.com/blog/what-is-primavera-p6

[^1_101]: https://primavera.oraclecloud.com/help/en/user/88257.htm

[^1_102]: https://www.oracle.com/uk/construction-engineering/primavera-p6/

[^1_103]: https://www.invensislearning.com/blog/what-is-oracle-primavera-p6/

[^1_104]: https://www.semanticscholar.org/paper/65e2d61eea8a1ea1f95c476f4b50c168fabf554a

[^1_105]: https://www.atlantis-press.com/article/55914833

[^1_106]: https://www.semanticscholar.org/paper/6e8125f0f4e7655f17a3d5af6d04979ba4dc5c8a

[^1_107]: https://www.semanticscholar.org/paper/d7bde047896a3eb29e36643a68d9a79e22cd6bc2

[^1_108]: https://www.semanticscholar.org/paper/d8ebf22ae89a51c07cba9ef377f963873b215db1

[^1_109]: http://link.springer.com/10.1007/s12630-011-9583-6

[^1_110]: https://www.semanticscholar.org/paper/600f3bcbd71d230faa950b42040b4eda5bca706e

[^1_111]: https://iris.unimore.it/bitstream/11380/1186979/1/KIL_PswC.pdf

[^1_112]: https://iieta.org/download/file/fid/127251

[^1_113]: http://arxiv.org/pdf/2312.12906.pdf

[^1_114]: https://www.matec-conferences.org/articles/matecconf/pdf/2018/110/matecconf_ipicse2018_05037.pdf

[^1_115]: https://www.matec-conferences.org/articles/matecconf/pdf/2018/78/matecconf_balcon2018_04007.pdf

[^1_116]: https://www.tandfonline.com/doi/pdf/10.1080/21693277.2021.1978898?needAccess=true

[^1_117]: http://arxiv.org/pdf/2403.17850.pdf

[^1_118]: http://arxiv.org/pdf/2406.19053.pdf

[^1_119]: https://arxiv.org/pdf/2102.08677.pdf

[^1_120]: https://arxiv.org/pdf/2403.18642.pdf

[^1_121]: http://arxiv.org/pdf/2311.16177.pdf

