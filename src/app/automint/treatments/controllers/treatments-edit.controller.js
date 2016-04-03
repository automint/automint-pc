(function() {
    angular.module('altairApp')
        .controller('treatmentsEditCtrl', TreatmentsEdit);

    TreatmentsEdit.$inject = ['$state', 'treatmentFactory'];

    function TreatmentsEdit($state, treatmentFactory) {
        var vm = this;
        //  temporary assignments
        var treatmentName = $state.params.name;
        //  declarations and mappings
        vm.save = save;
        //  define operation mode to disbable particular fields in different modes
        vm.operationMode = "edit";
        //  define object to track treatment details
        vm.treatment = {
            details: '',
            rate: {
                smallcar: '',
                mediumcar: '',
                largecar: '',
                xlargecar: '',
                default: ''
            }
        }

        //  default execution steps
        if (treatmentName == '' || treatmentName == undefined) {
            UIkit.notify("Something went wrong! Please Try Again!", {
                pos: 'bottom-right',
                status: 'danger',
                timeout: 3000
            });
            $state.go('restricted.treatments.all');
            return;
        }
        loadTreatment();
        
        //  auto load treatment details
        function loadTreatment() {
            treatmentFactory.treatmentDetails(treatmentName).then(function(res) {
                vm.treatment = res;
            });
        }

        //  save data to pouchDB instance
        function save() {
            treatmentFactory.saveTreatment(vm.treatment, vm.operationMode).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Treatment has been updated.", {
                        pos: 'bottom-right',
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.treatments.all");
                } else {
                    UIkit.notify("Treatment can not be updated at moment. Please Try Again!", {
                        pos: 'bottom-right',
                        status: 'info',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Treatment can not be updated at moment. Please Try Again!", {
                    pos: 'bottom-right',
                    status: 'info',
                    timeout: 3000
                });
            })
        }
    }
})();