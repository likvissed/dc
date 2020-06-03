class ServicesChangeColumns < ActiveRecord::Migration[5.2]
  def change
    change_column(:services, :kernel_count, :float)
    change_column(:services, :frequency, :float)
    change_column(:services, :memory, :float)
    change_column(:services, :disk_space, :float)
    change_column(:services, :network_speed, :float)
    change_column(:services, :value_backup_data, :float)
    change_column(:services, :storage_time, :integer)
    change_column(:services, :backup_volume, :float)
    change_column(:services, :max_time_rec, :integer)
    change_column(:services, :time_recovery, :integer)
    change_column(:services, :time_after_failure, :integer)
    change_column(:services, :time_after_disaster, :integer)
    change_column(:services, :antivirus, :integer)
  end
end
